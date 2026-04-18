import json
import requests
from pathlib import Path
from datetime import datetime
import time

MODEL = "mistral"
NUM_SAMPLES = 2000
OUTPUT_FILE = "rag_llm_stress/finance_contexts.jsonl"

FINANCE_TOPICS = [
    ("Finance", "Revenue", "What revenue represents in a business"),
    ("Finance", "Profit", "Difference between profit and revenue"),
    ("Finance", "Cash Flow", "Operating vs free cash flow"),
    ("Finance", "Net Worth", "Assets minus liabilities"),
    ("Finance", "Assets", "What qualifies as an asset"),
    ("Finance", "Liabilities", "Types of liabilities"),
    ("Finance", "Equity", "Shareholder equity meaning"),
    ("Finance", "Inflation", "Impact on purchasing power"),
    ("Finance", "Interest Rates", "Effect on loans and savings"),
    ("Finance", "APR", "Difference between APR and interest rate"),
    ("Finance", "Compound Interest", "How compounding works"),
    ("Finance", "CAGR", "Compound annual growth rate meaning"),
    ("Finance", "Stocks", "Ownership and shareholder rights"),
    ("Finance", "Bonds", "Bond pricing and yield"),
    ("Finance", "Yield", "What yield represents in investments"),
    ("Finance", "Dividends", "Dividend payments and purpose"),
    ("Finance", "Market Cap", "Company valuation via market cap"),
    ("Finance", "Volatility", "What volatility measures"),
    ("Finance", "Risk", "Types of financial risk"),
    ("Finance", "Return", "What return on investment means"),
    ("Finance", "Diversification", "Reducing risk through diversification"),
    ("Finance", "Portfolio", "Composition of investments"),
    ("Finance", "Asset Allocation", "How investments are distributed"),
    ("Finance", "Liquidity", "Ease of converting to cash"),
    ("Finance", "Solvency", "Ability to meet long-term obligations"),
    ("Finance", "Leverage", "Using borrowed money in investing"),
    ("Finance", "Margin", "Trading with borrowed funds"),
    ("Finance", "Derivatives", "Contracts based on underlying assets"),
    ("Finance", "Options", "Call and put options basics"),
    ("Finance", "Futures", "Obligation to buy or sell assets later"),
    ("Finance", "Hedging", "Reducing risk using financial instruments"),
    ("Finance", "GDP", "Economic output measurement"),
    ("Finance", "Recession", "Economic downturn indicators"),
    ("Finance", "Monetary Policy", "Central bank actions"),
    ("Finance", "Fiscal Policy", "Government spending and taxation"),
    ("Finance", "Central Bank", "Role of Federal Reserve"),
    ("Finance", "Credit Score", "Factors affecting credit score"),
    ("Finance", "Loans", "Types of loans and repayment"),
    ("Finance", "Amortization", "Loan repayment over time"),
    ("Finance", "Default", "Failure to repay debt"),
    ("Finance", "Bankruptcy", "Legal insolvency process"),
    ("Finance", "Exchange Rates", "Currency valuation"),
    ("Finance", "Forex", "Foreign exchange trading"),
    ("Finance", "ETF", "Exchange traded funds"),
    ("Finance", "Mutual Funds", "Pooled investment vehicles"),
    ("Finance", "Index Funds", "Passive investing strategy"),
    ("Finance", "Bull Market", "Rising market conditions"),
    ("Finance", "Bear Market", "Falling market conditions"),
    ("Finance", "Drawdown", "Decline from peak value"),
    ("Finance", "Alpha", "Excess return over benchmark"),
    ("Finance", "Beta", "Measure of volatility vs market"),
]

def load_completed_count(output_path: Path) -> int:
    if not output_path.exists():
        return 0
    count = 0
    with open(output_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                count += 1
    return count

def generate_context(field, topic, concept):
    prompt = f"""
You are a finance expert.

Write a precise factual explanation (80-120 words) about:
{concept}

Requirements:
- Clear and factual
- Include one example
- No fluff
"""
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
        },
        timeout=300,
    )
    response.raise_for_status()
    data = response.json()
    if "response" not in data:
        raise RuntimeError(f"Ollama returned: {data}")
    return data["response"].strip()

def main():
    Path("rag_llm_stress").mkdir(exist_ok=True)
    output_path = Path(OUTPUT_FILE)

    completed = load_completed_count(output_path)
    print(f"Resuming from sample {completed + 1}")

    with open(output_path, "a", encoding="utf-8") as f:
        for i in range(completed, NUM_SAMPLES):
            field, topic, concept = FINANCE_TOPICS[i % len(FINANCE_TOPICS)]
            print(f"Generating {i + 1}/{NUM_SAMPLES}...")

            try:
                context = generate_context(field, topic, concept)
                record = {
                    "id": f"finance_{i + 1}",
                    "field": field,
                    "topic": topic,
                    "concept": concept,
                    "context": context,
                    "generated_at": datetime.utcnow().isoformat(),
                    "model": MODEL,
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                f.flush()
            except Exception as e:
                print(f"Error on {i + 1}: {e}")
                time.sleep(5)
                continue

            time.sleep(0.2)

if __name__ == "__main__":
    main()