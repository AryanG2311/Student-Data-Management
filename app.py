import io
import re
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(title="Student Data Cleaning Engine")

# Explicitly configure CORS Middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_gender(val):
    if not val or pd.isna(val):
        return "Unknown"
    s = str(val).strip().lower()
    if s.startswith('m'):
        return "Male"
    if s.startswith('f'):
        return "Female"
    return "Unknown"

def clean_grade(val):
    if not val or pd.isna(val):
        return 0
    matches = re.findall(r'\d+', str(val))
    return int(matches[-1]) if matches else 0

def clean_score(val):
    if not val or pd.isna(val):
        return 0.0
    match = re.search(r'\d+(?:\.\d+)?', str(val))
    return float(match.group(0)) if match else 0.0

@app.post("/clean")
async def clean_csv(file: UploadFile = File(...)):
    """
    Accepts a raw student CSV file, cleans it using Pandas & Regex,
    and returns a standard JSON array.
    """
    contents = await file.read()
    # Parse raw bytes as CSV
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    # Normalize column names to lower case and strip whitespaces
    rename_dict = {}
    for col in df.columns:
        c_low = col.strip().lower()
        if 'name' in c_low:
            rename_dict[col] = 'name'
        elif 'gender' in c_low:
            rename_dict[col] = 'gender'
        elif 'grade' in c_low:
            rename_dict[col] = 'grade'
        elif 'math' in c_low:
            rename_dict[col] = 'math'
        elif 'science' in c_low:
            rename_dict[col] = 'science'
        elif 'english' in c_low:
            rename_dict[col] = 'english'
            
    df = df.rename(columns=rename_dict)
    
    # Fill in missing columns with empty string to avoid crashes
    required_cols = ['name', 'gender', 'grade', 'math', 'science', 'english']
    for col in required_cols:
        if col not in df.columns:
            df[col] = ""
            
    # clean candidate fields
    # format names
    df['name'] = df['name'].astype(str).str.replace(r'[\'"]', '', regex=True).str.strip().str.title()
    
    # normalize gender
    df['gender'] = df['gender'].apply(normalize_gender)
    
    # extract grade integer
    df['grade'] = df['grade'].apply(clean_grade)
    
    # parse subject scores
    df['math'] = df['math'].apply(clean_score)
    df['science'] = df['science'].apply(clean_score)
    df['english'] = df['english'].apply(clean_score)
    
    # sum score total
    df['total'] = df['math'] + df['science'] + df['english']
    
    # set default debarred state
    df['isDebarred'] = False
    
    # Keep only target columns and export
    target_cols = ['name', 'gender', 'grade', 'math', 'science', 'english', 'total', 'isDebarred']
    cleaned_data = df[target_cols].to_dict(orient='records')
    
    return cleaned_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
