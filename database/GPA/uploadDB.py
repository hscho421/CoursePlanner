import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

load_dotenv()
print(load_dotenv)
file_path = "filtered.csv"
df = pd.read_csv(file_path)

host= os.getenv("HOST")
user= os.getenv("USER")
password= os.getenv("PASSWORD")
database= os.getenv("DATABASE")

engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{database}")

# Upload the data to the table
df.to_sql("gpa_raw", engine, if_exists="replace", index=False)
print(f"Data successfully uploaded to {database}!")