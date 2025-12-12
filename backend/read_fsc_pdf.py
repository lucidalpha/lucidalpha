import sys
try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        print("No PDF library found")
        sys.exit(1)

try:
    reader = PdfReader(r"x:\Saisonalitäten Auswertung\CycleScanner_Whitepaper_FSC.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    print(f"Total characters: {len(text)}")
    
    keywords = ["Stability", "Score", "Bartels", "Formula", "Calculation"]
    
    lines = text.split('\n')
    for i, line in enumerate(lines):
        for kw in keywords:
            if kw.lower() in line.lower():
                print(f"--- Found '{kw}' at line {i} ---")
                start = max(0, i - 5)
                end = min(len(lines), i + 10)
                for j in range(start, end):
                     print(lines[j])
                print("-" * 20)
                break
except Exception as e:
    print(f"Error: {e}")
