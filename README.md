# Novate Persona

**Novate Persona** is a platform offering three AI-powered practice partners for language learning, IELTS Speaking, and clinical history-taking.

## Partners

| Partner | Description |
|--------|-------------|
| **Novatutor** | AI language tutor (persona: Tom Holland). Practice any of 10 languages with CEFR level adaptation (A1–C2), real-time corrections, translations, transliterations, and suggested replies. |
| **Nova IELTS** | AI IELTS Speaking examiner. Full 3-part test with timed responses, auto-activated microphone, and detailed band-score feedback (fluency, vocabulary, grammar, pronunciation). |
| **NovaPatient** | AI patient simulator for medical students to practice clinical history-taking. |

## Tech

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- **Voice input:** Browser Web Speech API (ASR)
- **AI replies:** Groq AI (Llama 3) via a local Node.js server.

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

For the backend server, create a `.env` file in the `server` directory:

- `GROQ_API_KEY` - Your Groq API key

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## License

MIT.
