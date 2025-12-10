import os
from dotenv import load_dotenv
from ai_service import ask_perplexity

# 1. Load Environment Variables
print("Loading environment variables...")
load_dotenv()

api_key = os.environ.get("PERPLEXITY_API_KEY")

# 2. Check Key
if not api_key:
    print("❌ ERROR: PERPLEXITY_API_KEY not found in environment variables.")
    print("Please make sure you have created a '.env' file in the 'backend' directory")
    print("and added: PERPLEXITY_API_KEY=pplx-...")
    exit(1)

print(f"✅ Found API Key: {api_key[:5]}...{api_key[-5:]}")

# 3. Test Connection
print("\nSending test request to Perplexity API...")
try:
    response = ask_perplexity("Hello, are you working? Please reply with 'Yes, I am working.'", context="System Test")
    
    if "error" in response:
        print(f"❌ API Error: {response['error']}")
    else:
        print(f"✅ Success! Response:\n{response['answer']}")

except Exception as e:
    print(f"❌ Exception occurred: {e}")
