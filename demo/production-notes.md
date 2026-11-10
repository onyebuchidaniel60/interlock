# Demo production notes

## Output

- `demo/interlock-demo.mp4`
- Duration: **109.36 seconds** (within the 180-second cap; target 90–150 seconds).
- Resolution: 1280×800, H.264 video, AAC audio.
- SHA-256: `87de5f61641eb5b4d882342311f4be76544622bb6c09fcc527e253b23f2904ef`
- Captions: burned in from `demo/captions.srt`; narration text in `demo/narration.md`.

## TTS

- Engine: **Kokoro ONNX** (`kokoro-onnx` 0.6.1), local inference.
- Model: Kokoro v1.0 ONNX (`kokoro-v1.0.onnx`); voices `voices-v1.0.bin`.
- Voice: `af_bella`; language `en-us`; speed 1.0; 24 kHz output.
- Licence: Kokoro model/voices are used under their Apache-2.0-compatible open model terms; no paid TTS or external quota used.
- Piper fallback was not needed because Kokoro ran locally.

## Recording

- Playwright Chromium, 1280×800, with a real signed-in session against the local production build and preview Neon branch.
- Deterministic synthetic workspace (`Phase 2 E2E Workspace`) and the verified demo data already in the preview database.
- Scenes: dashboard, observations, memory ledger, policy settings, plan creation, plan detail, rejected decision evidence, Memory OFF/ON comparison, approved/simulated decision, closing dashboard.
- The demo shows real Walrus blob IDs/hashes and a real Tatum balance; no provider evidence is fabricated.
- Captions were generated from the same narration timeline used to record the scenes.

## Reproduce

```bash
# 1. Generate narration + timeline (requires local Kokoro model files)
python3 demo/make-narration.py

# 2. Record against a running production build with a valid E2E_AUTH_STATE
E2E_AUTH_STATE=/path/to/state.json DEMO_BASE_URL=http://127.0.0.1:3128 \
  node demo/record-demo.mjs

# 3. Mux video + narration and burn captions
ffmpeg -y -i demo/raw/interlock-walkthrough.webm -i demo/narration.wav \
  -vf "subtitles=demo/captions.srt:force_style='FontName=DejaVu Sans,FontSize=17,PrimaryColour=&H00E7EEF2,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=26'" \
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest \
  demo/interlock-demo.mp4
```

## Redaction and review

- No API keys, tokens, cookies, private URLs or private account IDs appear.
- The workspace/user/email in the recording is synthetic. Wallet addresses are truncated by the UI.
- No production data or customer data was used.
- Playback verified with `ffprobe`; video and audio durations both 109.36s; audio mean −21.4 dB, max −2.0 dB.
- No public upload was performed; the artifact stays in `demo/`.
