import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(override=True)
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("hello")
    print("SUCCESS: Gemini responded.")
    print(response.text)
except Exception as e:
    print(f"FAILURE: {str(e)}")
