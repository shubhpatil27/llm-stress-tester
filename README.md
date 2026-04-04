# LLM Stress Tester

A system to evaluate hallucinations, inconsistency, and evasion behavior in Large Language Models (LLMs) using RAG-based verification.

---

## 🚀 What This Project Does

This system stress-tests an LLM (e.g., Llama3) by:

1. Generating domain-specific questions using another model (Mistral)
2. Using RAG (Retrieval-Augmented Generation) as ground truth
3. Asking the test model to answer without context
4. Verifying answers using:
   - RAG context (primary)
   - Wikipedia (fallback for factual questions)
5. Measuring:
   - Hallucination (wrong facts)
   - Inconsistency (different answers to same question)
   - Evasion (model avoids answering)

---

## 🧠 System Flow

```
RAG → Question Generation → Model Answer → Analysis → Report
```

---

## 📁 Project Structure

```
llm-stress-tester/
│
├── main.py                 # Entry point
├── analyzer.py             # Verification logic
├── generator.py            # Question generation
├── rag.py                  # Retrieval system
├── bandit.py               # Adaptive testing
├── models.py               # Ollama model interface
├── config.py               # Configuration (IMPORTANT)
│
├── rag_llm_stress/
│   └── stem_contexts.jsonl # RAG dataset
│
├── results.jsonl           # Output results
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/llm-stress-tester.git
cd llm-stress-tester
```

---

### 2. Open in VS Code

```bash
code .
```

---

### 3. Install dependencies

```bash
pip install scikit-learn wikipedia requests
```

---

### 4. Start Ollama

```bash
ollama serve
```

---

### 5. Pull required models

```bash
ollama pull llama3
ollama pull mistral
```

---

## ▶️ Running the Project

```bash
python main.py
```

---

## 🔧 Changing Domain / Testing

👉 **This is the only file you need to modify**

Open:

```
config.py
```

---

### Change domain

```python
CURRENT_DOMAIN = "education"
```

---

### Change RAG dataset path

```python
RAG_FILE = "rag_llm_stress/stem_contexts.jsonl"
```

👉 Replace with your own dataset if needed

---

### Change number of test steps

```python
NUM_STEPS = 200
```

Examples:
- 100 → quick test
- 200 → standard
- 500+ → strong evaluation

---

## 📊 Output

After running, you will see:

```
HALLUCINATION REPORT
```

Example:

```
Overall hallucination rate : 7.5%

Failure Breakdown:
  Hallucination : 15
  Inconsistency : 40
  Evasion       : 10
```

---

## 🧠 Interpretation

- **Hallucination** → model gave wrong facts
- **Inconsistency** → model gave different answers for same question
- **Evasion** → model avoided answering

---

## 🎯 Key Insight

This system does NOT just measure accuracy.

It tells you:

- Where the model fails
- Why it fails
- Whether it is reliable for real-world use

---

## 👥 Collaboration (Private Repo)

To give access to teammates:

1. Go to your GitHub repo
2. Click **Settings → Collaborators**
3. Add their GitHub usernames

---

## 🚀 Summary

This project helps you:

- Detect real hallucinations (not just inconsistency)
- Evaluate model reliability by domain
- Identify weak areas (e.g., factual vs reasoning)

---

## 📌 Tip

To test a new domain:

1. Create a new `.jsonl` RAG dataset
2. Update `config.py`
3. Run `main.py`

---
