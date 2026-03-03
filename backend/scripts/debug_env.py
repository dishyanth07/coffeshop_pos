import os
from dotenv import load_dotenv
load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")
print(f"KeyLength: {len(api_key) if api_key else 'None'}")
print(f"Prefix: {api_key[:6] if api_key else 'None'}")
print(f"Suffix: {api_key[-6:] if api_key else 'None'}")
