# Novate Persona

**Novate Persona** is a platform offering three AI-powered practice partners for language learning, IELTS Speaking, and clinical history-taking.

## Partners

| Partner | Description |
|--------|-------------|
| **Novatutor** | AI language tutor (persona: Novate Abby). Practice any of 10 languages with CEFR level adaptation (A1–C2), real-time corrections, translations, transliterations, and suggested replies. |
| **Nova IELTS** | AI IELTS Speaking examiner. Full 3-part test with timed responses, auto-activated microphone, and detailed band-score feedback (fluency, vocabulary, grammar, pronunciation). |
| **NovaPatient** | AI patient simulator for medical students to practice clinical history-taking. |

## Tech

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- **Voice input:** Browser Web Speech API (ASR)
- **AI replies:** Python FastAPI backend — **OpenAI** first, **Groq** (Llama 3.3) as fallback (`NovatepersonaBackend/llm.py`).

## Quick start

```bash
cd novate-persona
npm install

# Start the backend server
cd server
npm install
npm run dev

# Start the frontend (in a new terminal)
cd ..
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment

Configure the **Python backend** (`NovatepersonaBackend/.env`): `OPENAI_API_KEY` (primary), `GROQ_API_KEY` (fallback). See that folder’s README.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## License

MIT.
