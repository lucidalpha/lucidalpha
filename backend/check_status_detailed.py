
import sqlite3
from institutional_db import get_db_connection

conn = get_db_connection()
c = conn.cursor()
c.execute("SELECT name, cik FROM funds")
funds = c.fetchall()

print(f"Total Funds in DB: {len(funds)}")

for name, cik in funds:
    c.execute("SELECT COUNT(*) FROM filings WHERE cik = ?", (cik,))
    count = c.fetchone()[0]
    
    c.execute("SELECT MAX(report_date) FROM filings WHERE cik = ?", (cik,))
    last_date = c.fetchone()[0]
    
    print(f"| {name:<30} | {cik:<10} | {str(count):<5} | {str(last_date):<10} |")

conn.close()
