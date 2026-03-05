# TTS Edge Function — Pocket TTS only

This function proxies TTS to your **Pocket TTS** server. Voice uses only Pocket TTS (no OpenAI).

## 1. Run a Pocket TTS server

Run a server that exposes `/v1/audio/speech` and `/v1/audio/voices` (e.g. [pocket-tts-lovable](https://github.com/Novate-AI/pocket-tts-lovable) or [pocket-tts-server](https://github.com/ai-joe-git/pocket-tts-server)). If it’s only on your machine, expose it with [ngrok](https://ngrok.com) (e.g. `ngrok http 8000`) and use the HTTPS URL.

## 2. Deploy this function

From the project root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy tts
```

(`YOUR_PROJECT_REF` = the ID in your Supabase URL, e.g. `hgjuawsdaikusovlbave`.)

## 3. Set the secret in Supabase

Dashboard → Project → **Edge Functions** → **Secrets**. Add:

- **`POCKET_TTS_SERVER_URL`** = your Pocket TTS server URL (e.g. `https://xxxx.ngrok.io` or `http://your-server:8000`).

Optional: `POCKET_TTS_VOICE`, `POCKET_TTS_VOICE_MALE`, `POCKET_TTS_VOICE_FEMALE` (voice IDs).

## 4. Point the app at the function

In your app **`.env`**:

```
VITE_TTS_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/tts
```

Restart the app. Natural voice will come from Pocket TTS via this function.

---

## Production: Pocket TTS as voice

To use Pocket TTS in **production** (not just local):

1. **Host the Pocket TTS server** so it has a **public HTTPS URL** that Supabase can call:
   - Deploy [pocket-tts-server](https://github.com/ai-joe-git/pocket-tts-server) (or the backend from [pocket-tts-lovable](https://github.com/Novate-AI/pocket-tts-lovable)) on **Render**, **Railway**, **Fly.io**, **Google Cloud Run**, or a **VPS**. The service must expose `/v1/audio/speech` and `/v1/audio/voices`.
   - Use the deployed URL (e.g. `https://your-pocket-tts.onrender.com`).

2. **Supabase secrets (production):**  
   In your Supabase project, set **`POCKET_TTS_SERVER_URL`** to that **production** Pocket TTS URL (HTTPS). The Edge Function runs in Supabase’s cloud and must be able to reach your server.

3. **App production env:**  
   When building/deploying the frontend, set **`VITE_TTS_URL`** to your Supabase TTS function URL so the built app uses it:
   ```bash
   VITE_TTS_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/tts
   ```
   (Set this in your hosting dashboard as an env var, or in CI before `npm run build`.)

4. **Deploy the TTS function** (if not already):  
   `npx supabase functions deploy tts`

Result: in production, the app calls your Supabase `tts` function, which calls your **hosted Pocket TTS** server — voice in production uses only Pocket TTS.
