import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()
file_path = os.path.join(os.path.dirname(__file__), "filtered.csv")
df = pd.read_csv(file_path)

db_url = os.getenv("SUPABASE_DB_URL")
if not db_url:
    raise RuntimeError("SUPABASE_DB_URL is not set")

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(db_url)

# Upload the data to the table
df.to_sql("gpa_raw", engine, if_exists="replace", index=False)
print("Data successfully uploaded to Supabase!")
