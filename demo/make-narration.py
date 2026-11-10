import json
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path("/root/interlock")
OUT = ROOT / "demo"
OUT.mkdir(exist_ok=True)

scenes = [
    ("intro", "Interlock is a verified memory gate for multi-agent systems. Scout observes. Sentinel verifies. Runner simulates only when the evidence supports it."),
    ("observations", "Scout reads a public Sui balance through Tatum, stores the exact observation, and writes a signed fact to Walrus Memory. It verifies the recalled content before activating anything."),
    ("memory", "The memory ledger is an index, not the memory itself. Each record shows its author, scope, hash and Walrus blob. Pending or mismatched records are never active evidence."),
    ("policy", "An owner records a policy as an immutable Walrus constraint. Missing policy always means hold, never implicit approval."),
    ("plan", "An operator creates one immutable plan with an amount and exposure in basis points. The plan hash binds every later decision and clearance."),
    ("sentinel", "Sentinel enumerates the applicable records, recalls each blob, verifies namespace, author and hash, and applies fixed integer rules. No language model decides."),
    ("decision", "Here, a fifteen percent plan is rejected by a verified ten percent policy. The decision cites the exact fact and constraint, and the verdict is written back to Walrus."),
    ("demo", "The demo harness runs the same plan twice. The unguarded baseline would pass. The protected path rejects with real citations. Same input, different outcome."),
    ("runner", "Runner accepts only a final approval with a verified verdict memory. It mints a sixty second, single use clearance and records one simulation. No funds move."),
    ("close", "Interlock. Verified memory. Enforced decisions."),
]

k = Kokoro("/tmp/opencode/kokoro/kokoro-v1.0.onnx", "/tmp/opencode/kokoro/voices-v1.0.bin")
sample_rate = 24000
gap = 0.8
title_duration = 2.5
audio_parts = []
timeline = {"titleDuration": title_duration, "gap": gap, "scenes": []}

for scene_id, text in scenes:
    samples, sr = k.create(text, voice="af_bella", speed=1.0, lang="en-us")
    duration = len(samples) / sr
    scene_duration = round(duration + gap, 2)
    timeline["scenes"].append({"id": scene_id, "text": text, "audioDuration": round(duration, 2), "duration": scene_duration})
    audio_parts.append((samples, sr, duration))

total = title_duration + sum(item["duration"] for item in timeline["scenes"])
track = np.zeros(int(total * sample_rate), dtype=np.float32)
offset = title_duration
for (samples, sr, duration), scene in zip(audio_parts, timeline["scenes"]):
    start = int((offset + 0.25) * sample_rate)
    end = start + len(samples)
    track[start:end] = samples
    offset += scene["duration"]

sf.write(OUT / "narration.wav", track, sample_rate)
(OUT / "timeline.json").write_text(json.dumps(timeline, indent=2) + "\n")
print(f"generated {total:.2f}s narration; {len(scenes)} scenes")
for scene in timeline["scenes"]:
    print(scene["id"], scene["audioDuration"], "->", scene["duration"])
