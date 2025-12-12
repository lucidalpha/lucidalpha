from datetime import datetime
import json
import os
import time
import argparse
from dotenv import load_dotenv

# Load environment variables (especially PERPLEXITY_API_KEY)
load_dotenv()

# Configuration
# This is the prompt template provided by the user.
# We will inject the ticker into the placeholder.
SYSTEM_TEMPLATE = """
Du bist ein spezialisierter FX-Futures-Analyst mit Expertise in makroökonomischer Fundamentalanalyse. Deine Aufgabe ist es, für ein spezifisches Währungs-Future eine vollständige fundamentale Bewertung durchzuführen und eine klare Long/Short/Flat-Entscheidung mit Positionsgrößenempfehlung zu treffen.

# ANALYSEPROZESS

[... Das gesamte Prompt-System wurde hier integriert, aber gekürzt für das Skript ...]
(Der vollständige Text des Prompts wird im tatsächlichen Request gesendet)

# PHASEN
Führe die Analyse durch und gib am Ende ein JSON-Objekt zurück, das exakt dieses Format hat (kein Markdown drumherum, nur reines JSON):

{
  "currency": "Währungskürzel",
  "score": 0.0,
  "decision": "LONG" | "SHORT" | "FLAT",
  "conviction": "Hoch" | "Mittel" | "Niedrig",
  "summary": "Kurze Zusammenfassung (One-Liner)",
  "metrics": {
     "interest_rate": 0,
     "inflation": 0,
     "gdp": 0,
     "labor": 0,
     "trade": 0,
     "policy": 0,
     "sentiment": 0,
     "cot": 0
  }
}
"""

PROMPT_TEMPLATE = """
# STARTE DIE ANALYSE

**Währung für Analyse:** {ticker}
**Analysedatum:** {date}
**Zeithorizont:** Medium-term (1-3 Monate)

## HISTORISCHER KONTEXT (Deine Analysen der letzten Tage)
Nutze dies, um Konsistenz zu wahren. Wenn sich die Daten nicht grundlegend geändert haben, bleibe bei deinem Bias. Springe nicht wild hin und her, es sei denn, es gibt neue Fakten.
{history}

Bitte führe die Analyse basierend auf den aktuellen makroökonomischen Daten von heute durch.
Priorisiere aktuelle Daten aus den letzten 24-48 Stunden.
WICHTIG: Gib am Ende NUR das JSON-Objekt zurück.
"""

USER_FULL_INSTRUCTION_FILE = "ai_fx_prompt_template.txt"
RESULTS_FILE = "daily_fx_scores.json"

def load_prompt_template():
    if os.path.exists(USER_FULL_INSTRUCTION_FILE):
        with open(USER_FULL_INSTRUCTION_FILE, "r", encoding="utf-8") as f:
            return f.read()
    else:
        return SYSTEM_TEMPLATE

def get_recent_history_text(ticker, history_data):
    # Filter for ticker and sort by date descending
    items = [x for x in history_data if x.get('currency') == ticker]
    items.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    # Take last 3
    recent = items[:3]
    if not recent:
        return "Keine Daten vorhanden (Erste Analyse)."
        
    text = ""
    for item in recent:
        text += f"- {item.get('date')}: Score {item.get('score')} ({item.get('decision')}). Grund: {item.get('summary')}\n"
    return text

def ask_perplexity_simple(query, system_prompt):
    import requests
    
    api_key = os.getenv("PERPLEXITY_API_KEY")
    if not api_key:
        print("Error: PERPLEXITY_API_KEY not found in .env")
        return None

    url = "https://api.perplexity.ai/chat/completions"
    
    payload = {
        "model": "sonar-pro", 
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"API Error: {e}")
        return None

def extract_json(text):
    import re
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            json_str = match.group(0)
            return json.loads(json_str)
    except:
        pass
    return None

def run_daily_analysis(tickers=["EUR/USD", "GBP/USD", "JPY/USD", "AUD/USD", "CAD/USD", "CHF/USD"]):
    print("--- 🔄 Checking for Data Gaps (Backfill System) ---")
    
    # Load existing history
    history = []
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, "r") as f:
                history = json.load(f)
        except:
            history = []
            
    system_prompt = load_prompt_template()
    
    # Check last 3 days (Today, Yesterday, Day Before)
    import datetime as dt
    today = dt.datetime.now()
    dates_to_check = [(today - dt.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(3)]
    dates_to_check.reverse() # Process oldest first
    
    for target_date in dates_to_check:
        print(f"\n📅 Processing Date: {target_date}")
        is_today = (target_date == today.strftime("%Y-%m-%d"))
        
        for ticker in tickers:
            # Check if done
            already_done = any(x for x in history if x.get('date') == target_date and x.get('currency') == ticker)
            
            if already_done:
                print(f"  ✅ {ticker}: Already exists.")
                continue
            
            print(f"  ⏳ {ticker}: Missing. Running {'Backfill' if not is_today else 'Live Analysis'}...")
            
            # Context
            history_text = get_recent_history_text(ticker, history)
            
            # Prompt Adjustment for Past Dates
            date_instruction = f"Analysedatum: {target_date}."
            if not is_today:
                date_instruction += f" ACHTUNG: Dies ist eine historische Analyse für die VERGANGENHEIT ({target_date}). Ignoriere alle Ereignisse, die NACH diesem Datum passiert sind. Versetze dich genau in die Situation an diesem Tag."
            else:
                date_instruction += " Dies ist die aktuelle Live-Analyse von heute."
                
            prompt = PROMPT_TEMPLATE.replace("**Analysedatum:** {date}", f"**Analysedatum:** {target_date}").replace("{ticker}", ticker).replace("{history}", history_text)
            
            # Inject stricter date instruction if backfilling
            if not is_today:
                prompt = prompt.replace("Priorisiere aktuelle Daten aus den letzten 24-48 Stunden.", f"Priorisiere Daten, die am {target_date} aktuell waren.")
            else:
                prompt = prompt.replace("**Analysedatum:** {target_date}", f"**Analysedatum:** {target_date}") # clean up if needed

            # Replace {date} and others if replace() wasn't sufficient or if template changed
            # To be safe, format properly:
            # Re-read PROMPT_TEMPLATE format
            try:
                # We need to construct the prompt manually because PROMPT_TEMPLATE has {date} placeholders
                # and we might have partially replaced them or the original template expects them.
                # Simplest way: just format the original template string which is global
                prompt = PROMPT_TEMPLATE.format(ticker=ticker, date=target_date, history=history_text)
                
                # NOW modify for backfill
                if not is_today:
                     prompt += f"\n\n WICHTIGER HINWEIS: Wir simulieren den {target_date}. Tu so, als ob wir genau an diesem Tag wären. Nutze keine Infos aus der Zukunft."
            except:
                 pass

            # Call AI
            response_text = ask_perplexity_simple(prompt, system_prompt)
            
            if response_text:
                data = extract_json(response_text)
                if data:
                    data['date'] = target_date # Important: Force correct date
                    data['timestamp'] = int(dt.datetime.strptime(target_date, "%Y-%m-%d").timestamp())
                    if 'currency' not in data: data['currency'] = ticker
                    
                    history.append(data)
                    print(f"  🎉 Saved: {ticker} Score: {data.get('score')}")
                    
                    # Save immediately to prevent data loss on crash
                    with open(RESULTS_FILE, "w") as f:
                        json.dump(history, f, indent=4)
                else:
                    print(f"  ⚠️ Error parsing API result for {ticker}")
            else:
                print(f"  ❌ API Error for {ticker}")
            
            time.sleep(2) # Rate limit

    # Final Save
    with open(RESULTS_FILE, "w") as f:
        json.dump(history, f, indent=4)
    
    print(f"--- Completed. Saved to {RESULTS_FILE} ---")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tickers", nargs="+", help="List of tickers to analyze", default=["EUR/USD", "GBP/USD", "JPY/USD", "CHF/USD", "AUD/USD", "CAD/USD", "NZD/USD", "DXY"])
    args = parser.parse_args()
    
    run_daily_analysis(args.tickers)
