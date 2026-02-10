
import sqlite3
import os

DB_FILE = "institutional.db"

if not os.path.exists(DB_FILE):
    print(f"Error: {DB_FILE} does not exist.")
else:
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        
        tables = ["funds", "filings", "holdings"]
        for t in tables:
            try:
                c.execute(f"SELECT COUNT(*) FROM {t}")
                count = c.fetchone()[0]
                print(f"Table '{t}': {count} rows")
            except Exception as e:
                print(f"Error querying table '{t}': {e}")
                
        # Check specific query used in service
        sql = """
        WITH LatestFilings AS (
            SELECT cik, MAX(report_date) as last_date
            FROM filings
            GROUP BY cik
        )
        SELECT 
            f.cik, 
            f.name, 
            SUM(h.value) as total_value,
            lf.last_date,
            COUNT(h.name) as positions_count
        FROM funds f
        JOIN LatestFilings lf ON f.cik = lf.cik
        JOIN filings fil ON fil.cik = lf.cik AND fil.report_date = lf.last_date
        JOIN holdings h ON h.accession_number = fil.accession_number
        GROUP BY f.cik, f.name, lf.last_date
        ORDER BY total_value DESC
        """
        c.execute(sql)
        rows = c.fetchall()
        print(f"Main Query returned {len(rows)} rows.")
        if len(rows) > 0:
            print("First row:", rows[0])
            
        conn.close()
    except Exception as e:
        print(f"Database error: {e}")
