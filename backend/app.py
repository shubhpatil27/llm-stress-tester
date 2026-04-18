from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import subprocess
import threading
import json
import os

app = FastAPI(title="LLM Stress Tester API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent
RESULTS_FILE = ROOT / "results.jsonl"
LOG_FILE = ROOT / "backend_run.log"

job_state = {
    "running": False,
    "exit_code": None,
    "error": None,
}

def run_main():
    job_state["running"] = True
    job_state["exit_code"] = None
    job_state["error"] = None

    try:
        with open(LOG_FILE, "w", encoding="utf-8") as logf:
            proc = subprocess.Popen(
                ["python", "main.py"],
                cwd=str(ROOT),
                stdout=logf,
                stderr=subprocess.STDOUT,
                shell=True,
            )
            code = proc.wait()
            job_state["exit_code"] = code
    except Exception as e:
        job_state["error"] = str(e)
    finally:
        job_state["running"] = False

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/run")
def run_test():
    if job_state["running"]:
        return {"status": "already_running"}

    t = threading.Thread(target=run_main, daemon=True)
    t.start()
    return {"status": "started"}

@app.get("/api/status")
def status():
    return job_state

@app.get("/api/results")
def results():
    if not RESULTS_FILE.exists():
        return {"results": []}

    rows = []
    with open(RESULTS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    return {"count": len(rows), "results": rows[-50:]}

@app.get("/api/logs")
def logs():
    if not LOG_FILE.exists():
        return {"log": ""}
    return {"log": LOG_FILE.read_text(encoding="utf-8", errors="ignore")}