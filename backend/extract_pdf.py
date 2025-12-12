from pypdf import PdfReader
import os

try:
    reader = PdfReader(r"..\CycleScanner_Whitepaper_FSC.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    with open("whitepaper_content.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("PDF Text extracted successfully.")
except Exception as e:
    print(f"Error reading PDF: {e}")
