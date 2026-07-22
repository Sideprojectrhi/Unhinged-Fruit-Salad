"""
Serverless proxy for the Unhinged Fruit Salad chat.

Deploy target: Vercel (Python runtime). Vercel auto-detects any .py file
inside /api that defines a `handler` class and turns it into an endpoint —
this file becomes: https://your-site.vercel.app/api/fruit-salad

WHY THIS EXISTS:
The frontend (unhinged-fruit-salad.html) can't call Gemini directly because
that would expose your API key to anyone viewing page source, and browsers
calling Gemini's API directly can hit CORS issues anyway. This script runs
server-side, holds the real key as an environment variable (never shipped
to the browser), and forwards requests to Gemini on the frontend's behalf.

SETUP:
1. Get a free Gemini API key: https://aistudio.google.com
2. In your Vercel project settings -> Environment Variables, add:
     GEMINI_API_KEY = <your key>
3. Deploy this file at api/fruit-salad.py in your repo (same repo as the
   HTML file). Vercel picks it up automatically, no extra config needed.
4. No requirements.txt needed — this only uses Python's standard library.
"""

import json
import os
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

GEMINI_MODEL = "gemini-flash-latest"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


def build_system_prompt(her_name: str, mode: str = "home") -> str:
    """
    Sets the overall voice/rules for every reply based on mode.
    Modes: "home" (empathetic), "rant" (sympathetic), "roast" (sass only)
    """
    base = f"You are part of a playful, chaotic little web toy made as a personal gift for someone named {her_name}. "
    
    if mode == "rant":
        return (
            f"{base}"
            f"CRITICAL: {her_name} uses they/them pronouns. Never use she/her or he/him. "
            f"Always use they/them, or better yet, address them directly by name or as 'you'. "
            f"Misgendering is not acceptable. "
            f"You're in listening/support mode. Be genuinely empathetic, validating, and kind. "
            f"No roasting, no sass, no sarcasm. Offer perspective if it fits, but mostly just listen "
            f"and show you understand. This is a safe space. Never insincere or condescending. "
            f"Address them by name. Avoid the word 'love'. Do not use markdown formatting."
        )
    elif mode == "roast":
        return (
            f"{base}"
            f"CRITICAL: {her_name} uses they/them pronouns. Never use she/her or he/him. "
            f"Always use they/them, or better yet, address them directly by name or as 'you'. "
            f"Misgendering is not acceptable. "
            f"Sassy, bitchy, roasting energy is your ONLY personality — not a mood you're sometimes in, "
            f"an actual permanent trait. Never be sincere, wholesome, or genuinely complimentary; "
            f"if you compliment them, make it backhanded. Match your reply length to the moment — "
            f"a quick tease deserves one punchy line, but a proper roast can run longer. "
            f"Witty, unhinged, never corporate or generic. Address them by name sometimes. "
            f"Never mention being an AI or a language model. Avoid the word 'love'. "
            f"Do not use markdown formatting."
        )
    else:  # "home" or default
        return (
            f"{base}"
            f"CRITICAL: {her_name} uses they/them pronouns. Never use she/her or he/him. "
            f"Always use they/them, or better yet, address them directly by name or as 'you'. "
            f"Misgendering is not acceptable. "
            f"Read the intent of what they're saying. If they need sympathy or advice, be genuinely helpful "
            f"and empathetic. If they're venting anger, meet that energy with understanding. If it's casual "
            f"chat, be fun and witty. You're not limited to roasting; match the moment. "
            f"Address them by name sometimes. Avoid the word 'love'. "
            f"Do not use markdown formatting."
        )


def call_gemini(api_key: str, system_prompt: str, instruction: str, history: list, mode: str = "home") -> str:
    # Fold the recent conversation into plain text context for the model.
    convo_lines = []
    for turn in history[-10:]:
        speaker = "her" if turn.get("role") == "her" else "you"
        convo_lines.append(f"{speaker}: {turn.get('content','')}")
    convo_text = "\n".join(convo_lines)

    user_content = f"{instruction}\n\nRecent conversation:\n{convo_text}" if convo_text else instruction

    # Adjust maxOutputTokens based on mode
    max_tokens = 1000
    if mode == "rant":
        max_tokens = 2000  # Rants may need longer responses
    elif mode == "roast":
        max_tokens = 800   # Roasts are typically shorter/punchier

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_content}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 1.0
        },
    }

    req = urllib.request.Request(
        f"{GEMINI_URL}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {e.code}: {body[:300]}")

    candidates = data.get("candidates", [])
    if not candidates:
        raise ValueError("no candidates returned")
    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise ValueError("empty reply")
    return text


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw or b"{}")

            instruction = body.get("instruction", "Say something short and silly.")
            her_name = body.get("herName", "you")
            history = body.get("history", [])
            mode = body.get("mode", "home")  # home, rant, or roast

            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise RuntimeError("GEMINI_API_KEY is not set on the server")

            system_prompt = build_system_prompt(her_name, mode)
            reply = call_gemini(api_key, system_prompt, instruction, history, mode)

            self._send_json(200, {"reply": reply})

        except Exception as e:
            # Fail quietly with a 200 + fallback-friendly shape so the
            # frontend's own FALLBACK_LINES pool kicks in seamlessly.
            self._send_json(200, {"reply": None, "error": f"{e} | model_used={GEMINI_MODEL}"})

    def do_GET(self):
        self._send_json(200, {"status": "ok", "message": "POST to this endpoint to chat."})

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
