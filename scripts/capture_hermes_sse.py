#!/usr/bin/env python3
"""Capture a short Hermes SSE stream into a JSONL fixture file.

Usage:
    python scripts/capture_hermes_sse.py [--url URL] [--output FILE] [--max-events N]

This is a dev-only helper. Do not commit personal prompts or API keys.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx


def main() -> None:
    parser = argparse.ArgumentParser(description="Capture Hermes SSE stream to JSONL")
    parser.add_argument("--url", default="http://127.0.0.1:8642", help="Hermes API base URL")
    parser.add_argument("--output", default="tests/fixtures/hermes_sse_capture.jsonl", help="Output file")
    parser.add_argument("--max-events", type=int, default=20, help="Max events to capture")
    parser.add_argument("--prompt", default="Hello, please respond briefly.", help="Test prompt")
    parser.add_argument("--session-id", default="capture-session", help="Session ID for the run")
    parser.add_argument("--api-key", default=None, help="Hermes API key (optional)")
    args = parser.parse_args()

    headers: dict[str, str] = {}
    if args.api_key:
        headers["Authorization"] = f"Bearer {args.api_key}"

    base = args.url.rstrip("/")
    client = httpx.Client(timeout=30.0, headers=headers)

    print(f"Starting run against {base}...")
    resp = client.post(f"{base}/v1/runs", json={
        "session_id": args.session_id,
        "prompt": args.prompt,
    })
    resp.raise_for_status()
    run_id = resp.json().get("run_id", "unknown")
    print(f"Run started: {run_id}")

    output_path = Path(args.output)
    events = []

    print(f"Streaming events (max {args.max_events})...")
    with client.stream("GET", f"{base}/v1/runs/{run_id}/events") as stream:
        buffer = ""
        for chunk in stream.iter_text():
            buffer += chunk
            while "\n\n" in buffer:
                block, buffer = buffer.split("\n\n", 1)
                event_type = ""
                data_str = ""
                for line in block.split("\n"):
                    if line.startswith("event: "):
                        event_type = line[7:].strip()
                    elif line.startswith("data: "):
                        data_str = line[6:]

                if not data_str or data_str.strip() == "[DONE]":
                    continue

                try:
                    data = json.loads(data_str)
                    entry = {"event": event_type, "data": data}
                    events.append(entry)
                    print(f"  [{len(events)}] {event_type or data.get('type', 'unknown')}")
                except json.JSONDecodeError:
                    continue

                if len(events) >= args.max_events:
                    break
            if len(events) >= args.max_events:
                break

    # Sanitize: remove any real prompt content
    for entry in events:
        payload = entry.get("data", {}).get("payload", {})
        if "prompt" in payload:
            payload["prompt"] = "[REDACTED]"

    with open(output_path, "w") as f:
        for entry in events:
            f.write(json.dumps(entry) + "\n")

    print(f"\nCaptured {len(events)} events to {output_path}")
    print("IMPORTANT: Review the file for sensitive data before committing.")


if __name__ == "__main__":
    main()
