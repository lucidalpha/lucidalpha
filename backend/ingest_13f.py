
import requests
import json
import time
import os
import xml.etree.ElementTree as ET
from datetime import datetime
from institutional_db import get_db_connection

# Configuration
USER_AGENT = "LucidAlphaResearch contact@lucidalpha.com" # Must be valid format
TOP_FUNDS_FILE = "backends_data/top_funds.json"

def load_top_funds():
    if not os.path.exists(TOP_FUNDS_FILE):
        return []
    with open(TOP_FUNDS_FILE, "r") as f:
        return json.load(f)

def fetch_filings_list(cik):
    """Fetches recent submissions JSON from SEC to find 13F ACCESSION NUMBERS"""
    cik_padded = str(cik).zfill(10)
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    print(f"Fetching metadata for CIK {cik} from {url}...")
    
    headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate", "Host": "data.sec.gov"}
    
    try:
        r = requests.get(url, headers=headers, timeout=20)
        if r.status_code != 200:
            print(f"Error {r.status_code} fetching CIK {cik}: {r.text[:100]}")
            return []
        
        data = r.json()
        filings = data.get('filings', {}).get('recent', {})
        if not filings: return []
        
        results = []
        forms = filings.get('form', [])
        accs = filings.get('accessionNumber', [])
        dates = filings.get('filingDate', [])
        report_dates = filings.get('reportDate', []) # Not always present in list, sometimes needed to be inferred
        primary_docs = filings.get('primaryDocument', [])
        
        for i, form in enumerate(forms):
            if form == '13F-HR': # 13F Holdings Report
                # Link construction
                acc_no_dash = accs[i].replace('-', '')
                doc = primary_docs[i]
                
                # Check if we have an InfoTable XML
                # We need to list the directory usually, OR guess standard names.
                # Actually, data.sec.gov doesn't give the XML link directly in this JSON easily for the infotable.
                # We usually construct the index URL.
                
                results.append({
                    "accession_number": accs[i],
                    "filed_date": dates[i],
                    "report_date": report_dates[i] if report_dates and i < len(report_dates) else dates[i],
                    "cik": cik,
                    "primary_doc": doc
                })
                
                if len(results) >= 4: # Get last 4 quarters (1 year)
                    break
        return results
        
    except Exception as e:
        print(f"Fetch list error: {e}")
        return []

def fetch_infotable_xml(cik, accession_number, primary_doc):
    """
    To find the infotable, we often need to look at the index page or guess.
    Most 13F-HRs have a separate 'xml' for the InfoTable. 
    Standard naming often: 'infotable.xml' or similar. 
    However, parsing the main HTML/XML of the filing might link to it.
    
    Robust way: Use SEC Archive index.json or scrape the index page.
    Let's try standard 'infotable.xml' or 'InfoTable.xml' if the primary doc isn't it.
    Actually primary_doc usually contains the COVER PAGE. The Data is in the InfoTable.
    """
    
    acc_clean = accession_number.replace('-', '')
    base_url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_clean}"
    
    # Try finding the index.json or parsing index page is hard without scraping tools.
    # Let's try to fetch the index.xml or similar? 
    # Known trick: `index.xml` might list files.
    
    # Hack/Optimization: many modern 13Fs name it 'infotable.xml'
    # Let's try explicit common names.
    candidates = ["infotable.xml", "InfoTable.xml", "xml/infotable.xml"]
    
    headers = {"User-Agent": USER_AGENT, "Accept-Encoding": "gzip, deflate"}
    
    for c in candidates:
        url = f"{base_url}/{c}"
        try:
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                return r.content
        except:
            pass
        time.sleep(0.1)
        
    # If failed, we might need to look at the Filing Summary or search the index page.
    # Parsing the index page (HTML) to find the xml file ending in .xml that is NOT the primary doc?
    try:
        index_url = f"{base_url}/{accession_number}-index.html"
        r = requests.get(index_url, headers=headers)
        if r.status_code == 200:
            # Simple string find for .xml
            # This is rough but effective for a "Hack"
            import re
            links = re.findall(r'href="([^"]+\.xml)"', r.text)
            for l in links:
                l_lower = l.lower()
                if 'infotable' in l_lower or 'information' in l_lower or 'holding' in l_lower:
                     # It's a relative link usually just the filename
                     fname = l.split('/')[-1]
                     xml_url = f"{base_url}/{fname}"
                     print(f"Propsective XML: {xml_url}")
                     rx = requests.get(xml_url, headers=headers)
                     if rx.status_code == 200:
                         return rx.content
            print(f"Index scan found potential XMLs but no match: {links}")
        else:
             print(f"Index page not found: {index_url} ({r.status_code})")
    except Exception as e:
        print(f"Index page scan error: {e}")
        pass
        
    print(f"FAILED to find XML for {accession_number}. Base: {base_url}")
    return None

def parse_infotable(xml_content):
    """Parses standard 13F InfoTable XML"""
    print(f"Parsing XML content ({len(xml_content)} bytes)...")
    try:
        root = ET.fromstring(xml_content)
        # Namespace handling
        # 13F XMLs often have namespaces like {http://www.sec.gov/edgar/document/thirteenf/informationtable}
        # We strip namespaces for easier parsing
        
        holdings = []
        for info in root.findall(".//*"):
            # We iterate all nodes to find 'infoTable' equivalent regardless of namespace
            if 'infoTable' in info.tag:
                # Extract data
                # Need recursive search for children due to namespaces
                def get_val(parent, tag_part):
                     for child in parent:
                         if tag_part.lower() in child.tag.lower():
                             return child.text
                     return None
                
                # Deeper helpers for nested like <shrsOrPrnAmt><sshPrnamt>
                def get_nested_val(parent, path):
                     # path = ["shrsOrPrnAmt", "sshPrnamt"]
                     curr = parent
                     for p in path:
                         found = False
                         for child in curr:
                             if p.lower() in child.tag.lower():
                                 curr = child
                                 found = True
                                 break
                         if not found: return None
                     return curr.text

                name = get_val(info, 'nameOfIssuer')
                class_title = get_val(info, 'titleOfClass')
                cusip = get_val(info, 'cusip')
                value = get_val(info, 'value') # x1000 usually
                
                shares = get_nested_val(info, ["shrsOrPrnAmt", "sshPrnamt"])
                
                if name and value and shares:
                    holdings.append({
                        "name": name,
                        "cusip": cusip,
                        "value": float(value),
                        "shares": float(shares),
                        "ticker": None # CUSIP mapping needed later
                    })
        print(f"Parsed {len(holdings)} holdings.")
        return holdings
    except Exception as e:
        print(f"XML Parse Error: {e}")
        return []

def ingest_fund(fund):
    conn = get_db_connection()
    c = conn.cursor()
    
    # Insert Fund
    c.execute("INSERT OR REPLACE INTO funds (cik, name) VALUES (?, ?)", (fund['cik'], fund['name']))
    
    filings = fetch_filings_list(fund['cik'])
    
    for f in filings:
        # Check if already exists
        c.execute("SELECT 1 FROM filings WHERE accession_number = ?", (f['accession_number'],))
        if c.fetchone():
            print(f"Skipping existing filing {f['accession_number']}")
            continue
            
        print(f"Processing Filing {f['accession_number']} ({f['report_date']})")
        xml = fetch_infotable_xml(f['cik'], f['accession_number'], f['primary_doc'])
        
        if xml:
            holdings = parse_infotable(xml)
            if holdings:
                # Insert Filing
                c.execute("INSERT OR REPLACE INTO filings (accession_number, cik, report_date, filed_date) VALUES (?, ?, ?, ?)",
                          (f['accession_number'], f['cik'], f['report_date'], f['filed_date']))
                
                # Insert Holdings
                # Note: We need CUSIP mapping. For now we save CUSIP. 
                # Ideally we have a CUSIP->Ticker DB. 
                # Or we can use 'nameOfIssuer' to fuzzy match ticker if needed, but CUSIP is key.
                # For this MVP, we save the holding.
                
                # Simple Ticker Mapping for MVP
                TICKER_MAP = {
                    'APPLE INC': 'AAPL', 'APPLE COMPUTER': 'AAPL',
                    'NVIDIA CORP': 'NVDA',
                    'MICROSOFT CORP': 'MSFT',
                    'AMAZON COM': 'AMZN',
                    'ALPHABET INC': 'GOOGL', 'GOOGLE INC': 'GOOGL',
                    'TESLA INC': 'TSLA', 'TESLA MOTORS': 'TSLA',
                    'META PLATFORMS': 'META', 'FACEBOOK': 'META',
                    'ADVANCED MICRO': 'AMD',
                    'NETFLIX INC': 'NFLX',
                    'INTEL CORP': 'INTC',
                    'BERKSHIRE HATHAWAY': 'BRK.B',
                    'JPMORGAN CHASE': 'JPM'
                }

                for h in holdings:
                    # Try to map ticker
                    inferred_ticker = None
                    upper_name = h['name'].upper()
                    for k, v in TICKER_MAP.items():
                         if k in upper_name:
                             inferred_ticker = v
                             break
                    
                    c.execute('''
                        INSERT INTO holdings (accession_number, cusip, name, shares, value, ticker)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (f['accession_number'], h['cusip'], h['name'], h['shares'], h['value'], inferred_ticker))
                
                conn.commit()
        else:
             print(f"Skipping {f['accession_number']} due to missing XML.")
        
        time.sleep(1) # Polite delay
        
    conn.commit()
    conn.close()

def main():
    funds = load_top_funds()
    print(f"Found {len(funds)} funds to ingest.")
    
    for fund in funds:
        try:
            print(f"--- Ingesting {fund['name']} ---")
            ingest_fund(fund)
        except Exception as e:
            print(f"Error ingesting {fund['name']}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
