"""
Ingest to Supabase - RAG Knowledge Base Pipeline (Step 5)

Reads chunked_documents.jsonl and uploads to Supabase:
1. Creates knowledge_documents records via REST API
2. Sends chunks in batches of 50 to the embeddings edge function's ingest action

Prerequisites:
    export SUPABASE_URL=https://your-project.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

Usage:
    python scripts/ingest_to_supabase.py
"""

import json
import os
import re
import sys
import time
from urllib.parse import quote
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests is required. Install with: pip install requests")
    sys.exit(1)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHUNKS_FILE = PROJECT_ROOT / "scripts" / "chunked_documents.jsonl"

# Supabase config from environment
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

BATCH_SIZE = 50
RETRY_DELAY = 5  # seconds between retries
MAX_RETRIES = 3


def sanitize_text(text):
    """Remove Unicode sequences that PostgreSQL rejects (null bytes, unpaired surrogates)."""
    # Remove null bytes
    text = text.replace("\x00", "")
    # Remove literal \u0000 escape sequences
    text = re.sub(r"\\u0000", "", text)
    # Remove unpaired surrogates (U+D800 to U+DFFF)
    text = re.sub(r"[\ud800-\udfff]", "", text)
    return text


def validate_env():
    """Check required environment variables."""
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        print(f"ERROR: Missing environment variables: {', '.join(missing)}")
        print("Set them with:")
        print("  export SUPABASE_URL=https://your-project.supabase.co")
        print("  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        sys.exit(1)


def supabase_headers():
    """Get headers for Supabase REST API (service role)."""
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def get_chunk_count(document_id):
    """Check how many chunks already exist for a document."""
    url = f"{SUPABASE_URL}/rest/v1/document_chunks?document_id=eq.{document_id}&select=id"
    headers = supabase_headers()
    headers["Prefer"] = "count=exact"
    resp = requests.head(url, headers=headers)
    count = resp.headers.get("content-range", "")
    # Format is "0-N/total" or "*/0"
    if "/" in count:
        total = count.split("/")[-1]
        return int(total) if total != "*" else 0
    return 0


def create_document(doc_info):
    """Create a knowledge_documents record via REST API. Returns (doc_id, is_new)."""
    url = f"{SUPABASE_URL}/rest/v1/knowledge_documents"

    payload = {
        "filename": doc_info["filename"],
        "category": doc_info["category"],
        "title": doc_info.get("title", doc_info["filename"]),
        "total_chunks": doc_info["total_chunks"],
        "source_type": doc_info["source_type"],
        "metadata": doc_info.get("metadata", {}),
    }

    resp = requests.post(url, json=payload, headers=supabase_headers())

    if resp.status_code == 409 or (resp.status_code == 400 and "duplicate" in resp.text.lower()):
        # Already exists - fetch the existing one
        get_url = f"{SUPABASE_URL}/rest/v1/knowledge_documents?filename=eq.{quote(doc_info['filename'], safe='')}&select=id"
        get_resp = requests.get(get_url, headers=supabase_headers())
        if get_resp.status_code == 200 and get_resp.json():
            return get_resp.json()[0]["id"], False
        raise Exception(f"Document exists but couldn't fetch: {get_resp.text}")

    if resp.status_code not in (200, 201):
        raise Exception(f"Failed to create document: {resp.status_code} {resp.text}")

    return resp.json()[0]["id"], True


def ingest_batch(document_id, chunks):
    """Send a batch of chunks to the embeddings edge function for ingestion."""
    url = f"{SUPABASE_URL}/functions/v1/embeddings"

    payload = {
        "action": "ingest",
        "document_id": document_id,
        "chunks": [
            {
                "content": sanitize_text(chunk["text"]),
                "chunk_index": chunk["metadata"]["chunk_index"],
                "section_title": sanitize_text(chunk["metadata"].get("section_title", "")),
                "chunk_type": chunk["metadata"].get("chunk_type", "text"),
                "page_numbers": chunk["metadata"].get("page_numbers", []),
                "token_count": chunk["metadata"].get("token_count", 0),
                "metadata": {
                    "category": chunk["metadata"]["category"],
                    "source_type": chunk["metadata"]["source_type"],
                },
            }
            for chunk in chunks
        ],
    }

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    for attempt in range(MAX_RETRIES):
        resp = requests.post(url, json=payload, headers=headers, timeout=120)

        if resp.status_code == 200:
            return resp.json()

        if resp.status_code == 429:
            # Rate limited - wait and retry
            wait = RETRY_DELAY * (attempt + 1)
            print(f"    Rate limited, waiting {wait}s...")
            time.sleep(wait)
            continue

        if attempt < MAX_RETRIES - 1:
            print(f"    Attempt {attempt + 1} failed ({resp.status_code}), retrying...")
            time.sleep(RETRY_DELAY)
            continue

        raise Exception(f"Ingest failed after {MAX_RETRIES} attempts: {resp.status_code} {resp.text}")


def main():
    print("=" * 60)
    print("RAG Knowledge Base - Supabase Ingestion")
    print("=" * 60)

    validate_env()

    # Read chunks file
    if not CHUNKS_FILE.exists():
        print(f"ERROR: {CHUNKS_FILE} not found. Run chunk_documents.py first.")
        sys.exit(1)

    print(f"\nReading chunks from {CHUNKS_FILE}...")
    chunks = []
    with open(CHUNKS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))

    print(f"Loaded {len(chunks)} chunks")

    # Group chunks by source document
    docs = defaultdict(list)
    for chunk in chunks:
        doc_key = chunk["metadata"]["source_document"]
        docs[doc_key].append(chunk)

    print(f"From {len(docs)} documents")

    # Process each document
    total_ingested = 0
    skipped = 0
    errors = []
    start_time = time.time()

    for doc_idx, (doc_filename, doc_chunks) in enumerate(sorted(docs.items()), 1):
        first_chunk = doc_chunks[0]
        meta = first_chunk["metadata"]

        print(f"\n[{doc_idx}/{len(docs)}] {doc_filename[:60]}...")
        print(f"  Category: {meta['category']}, Chunks: {len(doc_chunks)}, Type: {meta['source_type']}")

        try:
            # Create document record
            doc_id, is_new = create_document({
                "filename": doc_filename,
                "category": meta["category"],
                "title": doc_filename.replace(".pdf", "").replace(".txt", ""),
                "total_chunks": len(doc_chunks),
                "source_type": meta["source_type"],
            })
            print(f"  Document ID: {doc_id}")

            # Skip if chunks already exist for this document
            if not is_new:
                existing_chunks = get_chunk_count(doc_id)
                if existing_chunks >= len(doc_chunks):
                    print(f"  SKIPPED: Already has {existing_chunks} chunks")
                    skipped += 1
                    continue
                print(f"  Existing chunks: {existing_chunks}, re-ingesting...")

            # Ingest chunks in batches
            for batch_start in range(0, len(doc_chunks), BATCH_SIZE):
                batch = doc_chunks[batch_start:batch_start + BATCH_SIZE]
                batch_end = batch_start + len(batch)
                print(f"  Ingesting chunks {batch_start + 1}-{batch_end}...", end=" ")

                result = ingest_batch(doc_id, batch)
                total_ingested += result.get("ingested", len(batch))
                print(f"OK ({result.get('ingested', len(batch))} ingested)")

                # Brief pause between batches to avoid rate limits
                if batch_end < len(doc_chunks):
                    time.sleep(1)

        except Exception as e:
            print(f"  ERROR: {e}")
            errors.append({"document": doc_filename, "error": str(e)})

    # Summary
    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("INGESTION SUMMARY")
    print("=" * 60)
    print(f"  Documents processed: {len(docs)}")
    print(f"  Documents skipped: {skipped}")
    print(f"  Chunks ingested: {total_ingested}")
    print(f"  Errors: {len(errors)}")
    print(f"  Time: {elapsed:.0f}s ({elapsed / 60:.1f} min)")

    if errors:
        print(f"\nErrors:")
        for e in errors:
            print(f"  - {e['document']}: {e['error']}")

    print("\nDone! Remember to REINDEX the IVFFlat index for optimal performance:")
    print("  REINDEX INDEX idx_document_chunks_embedding;")


if __name__ == "__main__":
    main()
