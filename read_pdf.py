import pdfplumber

pdf_path = r"D:\DATA_D\ProjectGitHub\eshop-sut\N09-mini_exercise.pdf"
output_path = r"D:\DATA_D\ProjectGitHub\eshop-sut\extracted_spec.txt"

with pdfplumber.open(pdf_path) as pdf:
    text = ""
    for page in pdf.pages:
        text += page.extract_text() or ""
        text += "\n\n--- PAGE BREAK ---\n\n"

with open(output_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted {len(pdf.pages)} pages to {output_path}")
