"""
Extract All PDFs - RAG Knowledge Base Pipeline (Step 1)

Auto-discovers all PDFs in knowledge-base/source-materials/ subdirectories
and extracts text to knowledge-base/source-materials/extracted-text/.

Preserves existing '--- PAGE N ---' format for compatibility with 191
already-extracted files. Adds [CATEGORY: ...] and [SOURCE: ...] metadata
headers to new extractions. Skips already-extracted files.

Usage:
    python scripts/extract_all_pdfs.py
"""

import os
import sys
from pathlib import Path

try:
    from PyPDF2 import PdfReader
except ImportError:
    print("ERROR: PyPDF2 is required. Install with: pip install PyPDF2")
    sys.exit(1)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SOURCE_BASE = PROJECT_ROOT / "knowledge-base" / "source-materials"
OUTPUT_FOLDER = SOURCE_BASE / "extracted-text"

# Categories map from directory names
CATEGORY_MAP = {
    "attachment-theory-neurosequential": "attachment-theory",
    "beliefs": "beliefs",
    "cbt-act": "cbt-act",
    "consciousness-neuroscience": "consciousness-neuroscience",
    "habits": "habits",
    "harm-reduction": "harm-reduction",
    "ifs": "ifs",
    "ipnb": "ipnb",
    "jungian": "jungian",
    "mind-body-chronic pain": "mind-body",
    "miscellaneous": "miscellaneous",
    "polyvagal": "polyvagal",
    "psychedelic-integration": "psychedelic-integration",
    "somatic": "somatic",
    "spirituality": "spirituality",
    "trauma-informed": "trauma-informed",
}


def discover_pdfs():
    """Recursively find all PDFs in source-materials subdirectories."""
    pdfs = []
    for dirpath, _dirnames, filenames in os.walk(SOURCE_BASE):
        # Skip the extracted-text directory
        if "extracted-text" in dirpath:
            continue
        for filename in filenames:
            if filename.lower().endswith(".pdf"):
                full_path = Path(dirpath) / filename
                # Determine category from parent directory
                rel = full_path.relative_to(SOURCE_BASE)
                category_dir = rel.parts[0] if len(rel.parts) > 1 else "miscellaneous"
                category = CATEGORY_MAP.get(category_dir, category_dir)
                pdfs.append({
                    "full_path": full_path,
                    "filename": filename,
                    "category": category,
                    "category_dir": category_dir,
                })
    return pdfs


def get_output_path(filename):
    """Get the output .txt path for a given PDF filename.
    Truncates long filenames to stay under Windows 260-char path limit."""
    txt_name = filename.rsplit(".", 1)[0] + ".txt"
    full_path = OUTPUT_FOLDER / txt_name
    # Windows MAX_PATH is 260; leave margin for safety
    if len(str(full_path)) > 250:
        max_stem = 250 - len(str(OUTPUT_FOLDER)) - 5  # 5 for / and .txt
        stem = filename.rsplit(".", 1)[0][:max_stem]
        txt_name = stem.rstrip() + ".txt"
        full_path = OUTPUT_FOLDER / txt_name
    return full_path


def extract_pdf(pdf_info):
    """Extract text from a single PDF with metadata headers."""
    full_path = pdf_info["full_path"]
    filename = pdf_info["filename"]
    category = pdf_info["category"]

    try:
        reader = PdfReader(str(full_path))
        text_parts = []

        # Add metadata headers for new extractions
        text_parts.append(f"[CATEGORY: {category}]")
        text_parts.append(f"[SOURCE: {filename}]")

        page_count = 0
        empty_pages = 0

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(f"\n\n--- PAGE {i + 1} ---\n\n")
                text_parts.append(page_text)
                page_count += 1
            else:
                empty_pages += 1

        full_text = "".join(text_parts)

        if page_count == 0:
            return {
                "status": "empty",
                "filename": filename,
                "message": f"No extractable text ({empty_pages} empty pages - may be scanned images)",
            }

        return {
            "status": "success",
            "filename": filename,
            "text": full_text,
            "pages": page_count,
            "empty_pages": empty_pages,
            "chars": len(full_text),
        }

    except Exception as e:
        return {
            "status": "error",
            "filename": filename,
            "message": str(e),
        }


def main():
    print("=" * 60)
    print("RAG Knowledge Base - PDF Extraction")
    print("=" * 60)

    # Ensure output directory exists
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    # Discover all PDFs
    pdfs = discover_pdfs()
    print(f"\nFound {len(pdfs)} PDFs across {len(set(p['category'] for p in pdfs))} categories")

    # Check which ones need extraction
    to_extract = []
    already_done = 0
    for pdf in pdfs:
        output_path = get_output_path(pdf["filename"])
        if output_path.exists():
            already_done += 1
        else:
            to_extract.append(pdf)

    print(f"Already extracted: {already_done}")
    print(f"Need extraction: {len(to_extract)}")

    if not to_extract:
        print("\nAll PDFs already extracted! Nothing to do.")
        return

    # Extract remaining PDFs
    print(f"\nExtracting {len(to_extract)} PDFs...\n")

    stats = {"success": 0, "empty": 0, "error": 0}
    empty_files = []
    errors = []

    for i, pdf in enumerate(to_extract, 1):
        print(f"  [{i}/{len(to_extract)}] {pdf['filename'][:60]}...", end=" ")

        result = extract_pdf(pdf)

        if result["status"] == "success":
            # Write the extracted text
            output_path = get_output_path(pdf["filename"])
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(result["text"])
            print(f"OK ({result['pages']} pages, {result['chars']} chars)")
            stats["success"] += 1

        elif result["status"] == "empty":
            print(f"EMPTY - {result['message']}")
            empty_files.append(result["filename"])
            stats["empty"] += 1

        else:
            print(f"ERROR - {result['message']}")
            errors.append({"filename": result["filename"], "error": result["message"]})
            stats["error"] += 1

    # Summary
    print("\n" + "=" * 60)
    print("EXTRACTION SUMMARY")
    print("=" * 60)
    print(f"  Successful: {stats['success']}")
    print(f"  Empty (scanned/images): {stats['empty']}")
    print(f"  Errors: {stats['error']}")
    print(f"  Previously done: {already_done}")
    print(f"  Total PDFs: {len(pdfs)}")

    if empty_files:
        print(f"\nEmpty files (consider OCR later):")
        for f in empty_files:
            print(f"  - {f}")

    if errors:
        print(f"\nErrors:")
        for e in errors:
            print(f"  - {e['filename']}: {e['error']}")

    print("\nDone!")


if __name__ == "__main__":
    main()
