"""
Chunk Documents - RAG Knowledge Base Pipeline (Step 2)

Semantic chunking for all extracted text files and protocol markdown files.
Respects section boundaries, protocol steps, and numbered exercises.

Output: scripts/chunked_documents.jsonl (one JSON object per line)

Each chunk has metadata:
  - source_document: original filename
  - category: therapeutic category
  - page_numbers: pages covered by this chunk
  - section_title: detected section heading
  - chunk_type: 'text' | 'protocol' | 'exercise' | 'reference'
  - chunk_index: position within document
  - source_type: 'pdf_extract' | 'protocol_markdown'

Usage:
    pip install tiktoken
    python scripts/chunk_documents.py
"""

import json
import os
import re
import sys
from pathlib import Path

try:
    import tiktoken
except ImportError:
    print("ERROR: tiktoken is required. Install with: pip install tiktoken")
    sys.exit(1)

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXTRACTED_TEXT_DIR = PROJECT_ROOT / "knowledge-base" / "source-materials" / "extracted-text"
PROTOCOLS_DIR = PROJECT_ROOT / "knowledge-base" / "protocols"
OUTPUT_FILE = PROJECT_ROOT / "scripts" / "chunked_documents.jsonl"

# Chunking parameters
TARGET_TOKENS = 750       # Sweet spot for embedding quality
MIN_TOKENS = 100          # Skip very small chunks
MAX_TOKENS = 1500         # Hard cap for protocol sequences
OVERLAP_TOKENS = 200      # Sliding window overlap for fallback
WINDOW_TOKENS = 800       # Sliding window size for fallback

# Initialize tokenizer (cl100k_base is used by text-embedding-3-small)
enc = tiktoken.get_encoding("cl100k_base")


def count_tokens(text):
    """Count tokens using tiktoken."""
    return len(enc.encode(text))


# Source-materials domain folder -> category slug. The PDFs are already
# organized by domain on disk, so the folder is the most reliable category
# signal (far better than keyword-guessing the filename). See BUG: 41% of
# chunks landed in 'miscellaneous' under the old filename-only approach.
SOURCE_MATERIALS_DIR = PROJECT_ROOT / "knowledge-base" / "source-materials"
DIR_TO_CATEGORY = {
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
_SOURCE_EXTS = {".pdf", ".docx", ".epub", ".txt"}


def build_stem_to_category():
    """Map each source file's stem -> category, derived from its domain folder.

    Prefers a specific category over 'miscellaneous' when a file appears in
    both (a few duplicates exist across folders).
    """
    stem_to_cat = {}
    for folder_name, cat in DIR_TO_CATEGORY.items():
        folder = SOURCE_MATERIALS_DIR / folder_name
        if not folder.exists():
            continue
        for f in folder.iterdir():
            if f.is_file() and f.suffix.lower() in _SOURCE_EXTS:
                existing = stem_to_cat.get(f.stem)
                # Prefer a specific category over 'miscellaneous'
                if existing and existing != "miscellaneous" and cat == "miscellaneous":
                    continue
                stem_to_cat[f.stem] = cat
    return stem_to_cat


# Built once at import; used by detect_category_from_folder().
STEM_TO_CATEGORY = build_stem_to_category()


def detect_category_from_folder(filename):
    """Look up a file's category by its domain folder. Exact stem match first,
    then a fuzzy fallback for renamed/truncated stems. Returns None if no match
    (caller falls back to keyword detection)."""
    stem = Path(filename).stem
    if stem in STEM_TO_CATEGORY:
        return STEM_TO_CATEGORY[stem]
    # Fuzzy fallback: longest shared prefix of >=15 chars (handles truncated titles)
    stem_l = stem.lower()
    best, best_len = None, 0
    for known_stem, cat in STEM_TO_CATEGORY.items():
        known_l = known_stem.lower()
        # one is a prefix of the other (e.g. "Self-Therapy Vol 3" vs full title)
        common = known_l if stem_l.startswith(known_l) else (
                 stem_l if known_l.startswith(stem_l) else "")
        if len(common) >= 15 and len(common) > best_len:
            best, best_len = cat, len(common)
    return best


def detect_category_from_metadata(text):
    """Extract category from [CATEGORY: ...] header if present."""
    match = re.search(r"\[CATEGORY:\s*(.+?)\]", text)
    return match.group(1).strip() if match else None


def detect_category_from_filename(filename):
    """Infer category from filename patterns."""
    lower = filename.lower()
    category_keywords = {
        "ifs": ["ifs", "internal family", "parts work", "self-led", "exile", "protector"],
        "polyvagal": ["polyvagal", "vagal", "vagus", "nervous system", "neuroception"],
        "somatic": ["somatic", "body", "embodiment", "sensorimotor"],
        "trauma-informed": ["trauma", "ptsd", "adverse", "interventions"],
        "cbt-act": ["cbt", "cognitive", "acceptance", "commitment", "distortion"],
        "psychedelic-integration": ["psychedelic", "integration", "ceremony", "ayahuasca", "psilocybin", "mdma"],
        "jungian": ["jung", "shadow", "archetype", "individuation", "active imagination"],
        "beliefs": ["belief", "schema", "core belief"],
        "attachment-theory": ["attachment", "bonding", "neurosequential"],
        "spirituality": ["spirit", "meditation", "contemplat", "mindful", "stoic"],
        "habits": ["habit", "behavior change"],
        "harm-reduction": ["harm reduction", "smart recovery", "substance"],
        "mind-body": ["chronic pain", "mind-body", "fibromyalgia"],
        "ipnb": ["interpersonal neurobiology", "ipnb", "siegel"],
        "consciousness-neuroscience": ["consciousness", "neuroscience", "brain"],
    }
    for cat, keywords in category_keywords.items():
        if any(kw in lower for kw in keywords):
            return cat
    return "miscellaneous"


PAGE_MARKER_RE = re.compile(r"---\s*PAGE\s*(\d+)\s*---")


def extract_and_strip_pages(text):
    """Pull all `--- PAGE N ---` markers out of a chunk's text.

    Returns (clean_text, sorted_unique_pages). Pages reflect ONLY the markers
    that fall within this chunk's span, so each chunk cites the actual pages it
    covers (fixes the old bug where a section accumulated the whole doc's pages).
    """
    pages = [int(m) for m in PAGE_MARKER_RE.findall(text)]
    clean = PAGE_MARKER_RE.sub("", text)
    # Collapse the blank lines the markers leave behind
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip(), sorted(set(pages))


def split_into_sections(text):
    """Split text into sections based on headings.

    Page markers (`--- PAGE N ---`) are LEFT INLINE in the section text so that
    per-chunk page numbers can be extracted later from each chunk's own span
    (see extract_and_strip_pages). We no longer track pages at the section level.
    """
    sections = []
    current_section = {"title": "", "text": ""}

    lines = text.split("\n")
    for line in lines:
        # Page markers pass straight through as inline text. Must come BEFORE
        # the ALL-CAPS check below — "--- PAGE 4 ---".isupper() is True, so
        # otherwise every marker would be mistaken for a section header and
        # consumed (which silently dropped all page numbers).
        if PAGE_MARKER_RE.match(line):
            current_section["text"] += line + "\n"
            continue

        # Markdown headings start a new section
        heading_match = re.match(r"^(#{1,4})\s+(.+)", line)
        if heading_match:
            if current_section["text"].strip():
                sections.append(current_section)
            current_section = {"title": heading_match.group(2).strip(), "text": ""}
            continue

        # ALL-CAPS section headers (common in PDF extracts)
        if line.strip() and line.strip().isupper() and 3 < len(line.strip()) < 80:
            if current_section["text"].strip():
                sections.append(current_section)
            current_section = {"title": line.strip().title(), "text": ""}
            continue

        current_section["text"] += line + "\n"

    if current_section["text"].strip():
        sections.append(current_section)

    return sections if sections else [{"title": "", "text": text}]


def chunk_section(section, target_tokens=TARGET_TOKENS, max_tokens=MAX_TOKENS):
    """Chunk a section, trying to respect paragraph and sentence boundaries."""
    text = section["text"].strip()
    if not text:
        return []

    tokens = count_tokens(text)

    # If section fits in one chunk, return as-is
    if tokens <= max_tokens:
        return [{"text": text, "tokens": tokens}]

    # Try splitting by paragraphs first
    paragraphs = re.split(r"\n\s*\n", text)
    chunks = []
    current_chunk = ""
    current_tokens = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        para_tokens = count_tokens(para)

        # If a single paragraph exceeds max, use sliding window on it
        if para_tokens > max_tokens:
            # Flush current chunk
            if current_chunk.strip():
                chunks.append({"text": current_chunk.strip(), "tokens": current_tokens})
                current_chunk = ""
                current_tokens = 0
            # Sliding window on large paragraph
            chunks.extend(sliding_window_chunk(para))
            continue

        # If adding this paragraph exceeds target, start new chunk
        if current_tokens + para_tokens > target_tokens and current_chunk.strip():
            chunks.append({"text": current_chunk.strip(), "tokens": current_tokens})
            current_chunk = para + "\n\n"
            current_tokens = para_tokens
        else:
            current_chunk += para + "\n\n"
            current_tokens += para_tokens

    # Flush remaining
    if current_chunk.strip():
        chunks.append({"text": current_chunk.strip(), "tokens": current_tokens})

    return chunks


def sliding_window_chunk(text, window=WINDOW_TOKENS, overlap=OVERLAP_TOKENS):
    """Fallback: sliding window chunking for unstructured prose."""
    tokens = enc.encode(text)
    chunks = []
    start = 0

    while start < len(tokens):
        end = min(start + window, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)

        if len(chunk_tokens) >= MIN_TOKENS:
            chunks.append({"text": chunk_text.strip(), "tokens": len(chunk_tokens)})

        if end >= len(tokens):
            break
        start += window - overlap

    return chunks


def detect_chunk_type(text, source_type):
    """Classify a chunk as text, protocol, exercise, or reference."""
    lower = text.lower()

    if source_type == "protocol_markdown":
        return "protocol"

    # Detect numbered steps/exercises
    step_patterns = [
        r"step\s+\d",
        r"exercise\s+\d",
        r"^\s*\d+\.\s+",
        r"practice\s*:",
        r"instructions?\s*:",
    ]
    for pattern in step_patterns:
        if re.search(pattern, lower, re.MULTILINE):
            return "exercise"

    # Detect references/bibliography
    ref_patterns = [
        r"references?\s*$",
        r"bibliography",
        r"\(\d{4}\)\.",
        r"et\s+al\.",
    ]
    for pattern in ref_patterns:
        if re.search(pattern, lower, re.MULTILINE):
            return "reference"

    return "text"


def process_text_file(filepath):
    """Process a single extracted text file into chunks."""
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    filename = filepath.name

    # Detect category: domain folder (most reliable) > [CATEGORY:] header >
    # filename keyword guess (last resort).
    category = (detect_category_from_folder(filename)
                or detect_category_from_metadata(text)
                or detect_category_from_filename(filename))

    # Remove metadata headers from text before chunking
    text = re.sub(r"\[CATEGORY:.*?\]\n?", "", text)
    text = re.sub(r"\[SOURCE:.*?\]\n?", "", text)

    # Split into sections
    sections = split_into_sections(text)

    chunks = []
    chunk_index = 0

    for section in sections:
        section_chunks = chunk_section(section)

        for chunk in section_chunks:
            # Pull page markers out of THIS chunk's span, then clean the text.
            clean_text, page_numbers = extract_and_strip_pages(chunk["text"])
            if not clean_text:
                continue
            token_count = count_tokens(clean_text)
            if token_count < MIN_TOKENS:
                continue

            chunks.append({
                "text": clean_text,
                "metadata": {
                    "source_document": filename.replace(".txt", ".pdf"),
                    "category": category,
                    "page_numbers": page_numbers,
                    "section_title": section.get("title", ""),
                    "chunk_type": detect_chunk_type(clean_text, "pdf_extract"),
                    "chunk_index": chunk_index,
                    "source_type": "pdf_extract",
                    "token_count": token_count,
                },
            })
            chunk_index += 1

    return chunks


def process_protocol_file(filepath):
    """Process a single protocol markdown file into chunks."""
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    filename = filepath.name
    rel_path = filepath.relative_to(PROTOCOLS_DIR)
    # Category from parent directory
    category_dir = rel_path.parts[0] if len(rel_path.parts) > 1 else "general"

    # Split into sections
    sections = split_into_sections(text)

    chunks = []
    chunk_index = 0

    for section in sections:
        section_chunks = chunk_section(section, target_tokens=TARGET_TOKENS, max_tokens=MAX_TOKENS)

        for chunk in section_chunks:
            if chunk["tokens"] < MIN_TOKENS:
                continue

            chunks.append({
                "text": chunk["text"],
                "metadata": {
                    "source_document": str(rel_path),
                    "category": category_dir,
                    "page_numbers": [],
                    "section_title": section.get("title", ""),
                    "chunk_type": "protocol",
                    "chunk_index": chunk_index,
                    "source_type": "protocol_markdown",
                    "token_count": chunk["tokens"],
                },
            })
            chunk_index += 1

    return chunks


def main():
    print("=" * 60)
    print("RAG Knowledge Base - Document Chunking")
    print("=" * 60)

    all_chunks = []

    # Process extracted text files
    txt_files = sorted(EXTRACTED_TEXT_DIR.glob("*.txt"))
    print(f"\nFound {len(txt_files)} extracted text files")

    for i, filepath in enumerate(txt_files, 1):
        chunks = process_text_file(filepath)
        all_chunks.extend(chunks)
        if i % 50 == 0 or i == len(txt_files):
            print(f"  Processed {i}/{len(txt_files)} text files ({len(all_chunks)} chunks so far)")

    # Process protocol markdown files
    md_files = sorted(PROTOCOLS_DIR.rglob("*.md"))
    print(f"\nFound {len(md_files)} protocol markdown files")

    for i, filepath in enumerate(md_files, 1):
        chunks = process_protocol_file(filepath)
        all_chunks.extend(chunks)

    print(f"  Processed {len(md_files)} protocol files")

    # Write output
    print(f"\nWriting {len(all_chunks)} chunks to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    # Statistics
    categories = {}
    chunk_types = {}
    source_types = {}
    total_tokens = 0

    for chunk in all_chunks:
        meta = chunk["metadata"]
        cat = meta["category"]
        ct = meta["chunk_type"]
        st = meta["source_type"]
        tokens = meta["token_count"]

        categories[cat] = categories.get(cat, 0) + 1
        chunk_types[ct] = chunk_types.get(ct, 0) + 1
        source_types[st] = source_types.get(st, 0) + 1
        total_tokens += tokens

    print("\n" + "=" * 60)
    print("CHUNKING SUMMARY")
    print("=" * 60)
    print(f"  Total chunks: {len(all_chunks)}")
    print(f"  Total tokens: {total_tokens:,}")
    print(f"  Avg tokens/chunk: {total_tokens // max(len(all_chunks), 1)}")
    print(f"  Est. embedding cost: ${total_tokens * 0.00002 / 1000:.2f}")

    print(f"\nBy category:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    print(f"\nBy chunk type:")
    for ct, count in sorted(chunk_types.items(), key=lambda x: -x[1]):
        print(f"  {ct}: {count}")

    print(f"\nBy source type:")
    for st, count in sorted(source_types.items(), key=lambda x: -x[1]):
        print(f"  {st}: {count}")

    print("\nDone!")


if __name__ == "__main__":
    main()
