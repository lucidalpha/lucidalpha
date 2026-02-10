
import sqlite3
import os

DB_FILE = "institutional.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Funds Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS funds (
            cik TEXT PRIMARY KEY,
            name TEXT,
            manager TEXT,
            strategy TEXT
        )
    ''')
    
    # Filings Table (One per Quarter per Fund)
    c.execute('''
        CREATE TABLE IF NOT EXISTS filings (
            accession_number TEXT PRIMARY KEY,
            cik TEXT,
            report_date TEXT, -- Period of Report (e.g. 2023-09-30)
            filed_date TEXT,  -- When it appeared on SEC
            quarter TEXT,     -- e.g. "Q3 2023"
            FOREIGN KEY (cik) REFERENCES funds (cik)
        )
    ''')
    
    # Holdings Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS holdings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accession_number TEXT,
            ticker TEXT,
            cusip TEXT,
            name TEXT,
            shares INTEGER,
            value INTEGER, -- In Dollars (often x1000 in filings, we will store actual)
            pct_portfolio REAL, -- Calculated
            FOREIGN KEY (accession_number) REFERENCES filings (accession_number)
        )
    ''')

    # Index for speed
    c.execute('CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON holdings (ticker)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_holdings_acc ON holdings (accession_number)')
    
    conn.commit()
    conn.close()
    print("Institutional DB initialized.")

if __name__ == "__main__":
    init_db()
