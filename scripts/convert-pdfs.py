from PyPDF2 import PdfReader
import os

# Source folder
source_base = r"c:\Users\hadfi\psychedelic-integration-app\knowledge-base\source-materials"

# Output folder
output_folder = r"c:\Users\hadfi\psychedelic-integration-app\knowledge-base\source-materials\extracted-text"

# Create output folder if it doesn't exist
os.makedirs(output_folder, exist_ok=True)

# PDFs to convert - Harm reduction and miscellaneous materials
pdfs_to_convert = [
    # Harm Reduction
    r"harm-reduction\SMART Recovery Handbook.pdf",

    # Miscellaneous
    r"miscellaneous\Feelings Wheel in PDF.pdf",
    r"miscellaneous\Get Out of Your Own Way  Overcoming Self-Defeating Behavior .pdf",
    r"miscellaneous\Good Inside.pdf",
    r"miscellaneous\Lost Connections.pdf",
    r"miscellaneous\The Motivational Interviewing Workbook  Exercises to Decide What You Want and How to Get There.pdf",
    r"miscellaneous\Thinking, Fast and Slow.pdf",
    r"miscellaneous\What If..._ Collected Thought Experiments in Philosophy-Routledge (2016).pdf",
]

for pdf_path in pdfs_to_convert:
    full_path = os.path.join(source_base, pdf_path)

    if not os.path.exists(full_path):
        print(f"NOT FOUND: {pdf_path}")
        continue

    # Check if already converted
    output_name = os.path.basename(pdf_path).replace(".pdf", ".txt")
    output_path = os.path.join(output_folder, output_name)
    if os.path.exists(output_path):
        print(f"ALREADY EXISTS: {output_name}")
        continue

    try:
        print(f"Converting: {os.path.basename(pdf_path)}...")
        reader = PdfReader(full_path)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n\n--- PAGE {i+1} ---\n\n"
                text += page_text

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

        print(f"  SUCCESS: {output_name} ({len(text)} chars)")

    except Exception as e:
        print(f"  ERROR: {e}")

print("\nDone! Check the extracted-text folder.")
