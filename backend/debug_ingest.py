
import logging
import sys
from ingest_13f import ingest_fund

# Setup basic config for logging to see stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

fund = {
    "name": "RENAISSANCE TECHNOLOGIES",
    "cik": "0001037389"
}

print(f"Starting debug ingest for {fund['name']}...")
try:
    ingest_fund(fund)
    print("Ingest complete.")
except Exception as e:
    print(f"Ingest failed: {e}")
    import traceback
    traceback.print_exc()
