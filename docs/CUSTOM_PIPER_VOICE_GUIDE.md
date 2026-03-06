# Custom Piper Voice: Training, Hosting & Integration

Complete guide to train a custom Piper TTS voice from your 2-minute recording, host it on GitHub + jsDelivr, and use it in NovatePersona.

---

## Part 1: Prepare Your Recording

### 1.1 Format your audio
- **Format:** WAV, 16-bit, mono
- **Sample rate:** 22,050 Hz (for medium quality) or 16,000 Hz (for low quality)
- **Length:** 2 minutes is workable for fine-tuning (ideally 5+ min for better results)
- **Quality:** Quiet room, clear speech, minimal background noise

**Convert with FFmpeg (if needed):**
```bash
ffmpeg -i your_recording.mp3 -ar 22050 -ac 1 -sample_fmt s16 your_voice.wav
```

### 1.2 Split into sentences
Split your 2-minute recording into individual utterances (1–10 seconds each).

**Option A – Manual:** Use Audacity to cut at pauses, export each as `0.wav`, `1.wav`, `2.wav`, etc.

**Option B – Auto:** Use `pyannote.audio` or `silero-vad` to detect speech segments and split automatically.

### 1.3 Transcribe each clip
You need the exact text for each audio file.

**Using Whisper (recommended):**
```bash
pip install openai-whisper
whisper your_voice.wav --language en --model base
```

For split files:
```bash
for f in wav/*.wav; do whisper "$f" --language en --model base --output_dir transcripts; done
```

### 1.4 Create the dataset
Create a folder structure:
```
my_voice_dataset/
├── wav/
│   ├── 0.wav
│   ├── 1.wav
│   ├── 2.wav
│   └── ...
└── metadata.csv
```

**metadata.csv** (no header, pipe `|` delimiter):
```
0|Hello, this is the first sentence.
1|And this is the second sentence.
2|Continue with each utterance.
```

Format: `id|text` (id = filename without .wav)

---

## Part 2: Train the Piper Model

### 2.1 Option A – Google Colab (easiest, free GPU)

1. Open [Piper Training Colab](https://colab.research.google.com/) or search "Piper TTS training Colab".
2. Upload your `my_voice_dataset` folder to Colab.
3. Run the preprocessing cell:
```python
!python3 -m piper_train.preprocess \
  --language en-us \
  --input-dir /content/my_voice_dataset/ \
  --output-dir /content/piper_training/ \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 22050
```
4. Download a checkpoint to fine-tune from: [rhasspy/piper-checkpoints](https://huggingface.co/datasets/rhasspy/piper-checkpoints/tree/main) – e.g. `en/en_US/lessac/medium/` (download the `.ckpt` file).
5. Run the training cell (fine-tune for ~500–1000 epochs).
6. Export to ONNX:
```python
!python3 -m piper_train.export_onnx /path/to/checkpoint.ckpt /path/to/output.onnx
!cp /path/to/config.json /path/to/output.onnx.json
```

### 2.2 Option B – Local (Linux/WSL + GPU)

1. Clone Piper:
```bash
git clone https://github.com/rhasspy/piper.git
cd piper/src/python
```

2. Install deps (see [Piper TRAINING.md](https://github.com/rhasspy/piper/blob/master/TRAINING.md)).

3. Preprocess:
```bash
python3 -m piper_train.preprocess \
  --language en-us \
  --input-dir /path/to/my_voice_dataset/ \
  --output-dir /path/to/piper_training/ \
  --dataset-format ljspeech \
  --single-speaker \
  --sample-rate 22050
```

4. Fine-tune (download checkpoint first):
```bash
python3 -m piper_train \
  --dataset-dir /path/to/piper_training/ \
  --accelerator gpu \
  --devices 1 \
  --batch-size 16 \
  --validation-split 0.0 \
  --max_epochs 1000 \
  --resume_from_checkpoint /path/to/lessac/epoch=2164-step=1355540.ckpt \
  --checkpoint-epochs 1 \
  --quality medium
```

5. Export:
```bash
python3 -m piper_train.export_onnx /path/to/best.ckpt my_custom_voice.onnx
cp /path/to/piper_training/config.json my_custom_voice.onnx.json
```

### 2.3 Output files
You should have:
- `my_custom_voice.onnx` (model)
- `my_custom_voice.onnx.json` (config)

---

## Part 3: Host on GitHub + jsDelivr

### 3.1 Create a GitHub repo
1. Go to [github.com/new](https://github.com/new).
2. Name it e.g. `piper-custom-voices`.
3. Create the repo (no README needed).

### 3.2 Add your voice files
1. Create a folder, e.g. `en/en_US/my_voice/medium/`.
2. Put in it:
   - `en_US-my_voice-medium.onnx`
   - `en_US-my_voice-medium.onnx.json`

Name format: `{lang}_{region}-{speaker}-{quality}.onnx` (e.g. `en_US-my_voice-medium.onnx`).

3. Commit and push:
```bash
git init
git add .
git commit -m "Add custom Piper voice"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/piper-custom-voices.git
git push -u origin main
```

### 3.3 jsDelivr URLs
jsDelivr serves files from GitHub:

- Model: `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/piper-custom-voices@main/en/en_US/my_voice/medium/en_US-my_voice-medium.onnx`
- Config: `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/piper-custom-voices@main/en/en_US/my_voice/medium/en_US-my_voice-medium.onnx.json`

Replace `YOUR_USERNAME` and paths to match your repo.

---

## Part 4: Integrate into NovatePersona

The `piper-tts-web` library fetches models from HuggingFace by default. To use your jsDelivr-hosted voice you need to patch it.

### 4.1 Install patch-package
```bash
cd NovatePersona
npm install patch-package --save-dev
```

Add to `package.json` scripts:
```json
"postinstall": "patch-package"
```

### 4.2 Create the patch

1. In `node_modules/@mintplex-labs/piper-tts-web/dist/`, find `piper-tts-web.js`.

2. Add a custom base URL option. At the top (after the PATH_MAP), add:
```javascript
// Custom model base URL - if set, overrides HF_BASE for specific voices
const CUSTOM_VOICE_BASE = "https://cdn.jsdelivr.net/gh/YOUR_USERNAME/piper-custom-voices@main";
const CUSTOM_VOICE_IDS = { "en_US-my_voice-medium": "en/en_US/my_voice/medium/en_US-my_voice-medium.onnx" };
```

3. In the `TtsSession` constructor, accept `modelBaseUrl`:
```javascript
constructor({ voiceId, progress, logger, wasmPaths, modelBaseUrl }) {
  // ... existing code ...
  this.modelBaseUrl = modelBaseUrl || null;
}
```

4. In `init()`, change the fetch logic:
```javascript
const path = PATH_MAP[this.voiceId] || CUSTOM_VOICE_IDS[this.voiceId];
const base = (CUSTOM_VOICE_IDS[this.voiceId] && this.modelBaseUrl) ? this.modelBaseUrl : HF_BASE;
const modelConfigBlob = await getBlob(`${base}/${path}.json`);
// ... same for model blob
```

5. Generate the patch:
```bash
npx patch-package @mintplex-labs/piper-tts-web
```

This creates `patches/@mintplex-labs+piper-tts-web+1.0.4.patch`.

### 4.3 Use your voice in the app

In `src/hooks/useSpeechSynthesis.ts`, add your voice to `PIPER_VOICES`:
```typescript
"en-US": "en_US-my_voice-medium",
en: "en_US-my_voice-medium",
```

And pass `modelBaseUrl` when creating the session (if your patch supports it):
```typescript
const session = await tts.TtsSession.create({
  voiceId: piperVoiceId,
  wasmPaths: PIPER_WASM_PATHS,
  modelBaseUrl: "https://cdn.jsdelivr.net/gh/YOUR_USERNAME/piper-custom-voices@main",
});
```

---

## Quick Reference

| Step | What |
|------|------|
| 1 | Record 2 min → WAV 22kHz mono |
| 2 | Split into sentences, transcribe with Whisper |
| 3 | Create `wav/` + `metadata.csv` |
| 4 | Train in Colab or locally (fine-tune from lessac) |
| 5 | Export `.onnx` + `.onnx.json` |
| 6 | Push to GitHub in correct folder structure |
| 7 | Use jsDelivr URLs |
| 8 | Patch piper-tts-web to support custom base URL |
| 9 | Add voice ID to `useSpeechSynthesis.ts` |

---

## Notes

- **2 minutes** is on the short side; 5+ minutes usually gives better quality.
- Fine-tuning from an existing model (e.g. lessac) works better than training from scratch with little data.
- jsDelivr can take a few minutes to update after a new push.
- If patching is too involved, consider forking `piper-tts-web` and adding a `modelBaseUrl` option, then installing from your fork.
