
import sqlite3
import pandas as pd
from institutional_db import get_db_connection

conn = get_db_connection()
sql = """
    SELECT f.name, count(fil.accession_number) as filings_count, MAX(fil.report_date) as last_report
    FROM funds f
    LEFT JOIN filings fil ON f.cik = fil.cik
    GROUP BY f.name
    ORDER BY last_report DESC
"""
df = pd.read_sql_query(sql, conn)
print(df.to_string())
conn.close()
