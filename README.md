# LazyDesk – AI‑powered task declutterer

**Tagline:** *Do less. Make progress.*

## 📚 Problem statement
Messy, unstructured to‑do lists overwhelm people, consuming mental energy just to figure out what to do next. **LazyDesk** helps you quickly turn a chaotic list of tasks into a clear, prioritized daily plan, powered by an open‑weight LLM.

## ✨ Features
- Paste any free‑form task list into a textarea.
- AI generates:
  - A short workload summary.
  - The three most important tasks.
  - Logical categories (e.g., Work, Personal).
  - Priority levels (High, Medium, Low).
  - Estimated effort for each task.
  - One easy starter task.
  - A realistic, low‑stress daily plan.
- **Lazy Mode** – limits the plan to three tasks and emphasizes a single starter step.
- Copy‑to‑clipboard, reset, and per‑task completion checkboxes.
- Dark theme with soothing lavender accents and a friendly sloth mascot (emoji).
- Demo mode with realistic sample results when no API key is configured.

## 🛠️ Tech stack & architecture
| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Node.js, Express, `node-fetch` |
| AI provider | Any hosted **open‑weight** model (default: Groq `llama3-8b-8192`). Configurable via environment variables |

The backend keeps the API key server‑side and talks to the LLM. The frontend only receives the structured JSON output.

## 📦 Prerequisites
- Node.js ≥ 20 (recommended)
- npm (comes with Node)

## 🚀 Setup & development
```bash
# Clone the repo (once you have it locally)
# cd into the project folder
cd lazy-desk

# Install dependencies
npm install

# Copy the example env and add your Groq (or compatible) API key
cp .env.example .env
# Edit .env and set GROQ_API_KEY and optionally GROQ_MODEL, PORT

# Start the dev server (nodemon will restart on changes)
npm run dev
```
Open <http://localhost:3000> in a browser.

## 🧪 Example usage
**Input:**
```
- finish report for work
- buy groceries
- call mom about weekend plans
- schedule dentist appointment
- read a chapter of a book
```
**Output (demo mode):**
```json
{
  "summary": "You have a mix of work and personal tasks.",
  "importantTasks": ["Finish project report","Buy groceries","Schedule doctor appointment"],
  "categories": {"Work": ["Finish project report","Email client","Update spreadsheet"],"Personal": ["Buy groceries","Call Mom","Read a book"]},
  "priorities": {"Finish project report": "High","Buy groceries": "Medium","Schedule doctor appointment": "Low"},
  "effort": {"Finish project report": "3h","Buy groceries": "30m","Schedule doctor appointment": "15m"},
  "starterTask": "Buy groceries",
  "dailyPlan": "1. Finish project report (High)\n2. Buy groceries (Medium)\n3. Call Mom (Low)"
}
```
The UI will render this nicely as cards with priority badges and effort estimates.

## 🔌 API endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check, returns `{ status: "ok" }` |
| `POST` | `/api/plan` | Body: `{ tasks: string, lazyMode?: boolean }`. Returns `{ demo: boolean, data: <structured JSON> }` |

The endpoint validates input length (max 2000 chars) and falls back to demo data when `GROQ_API_KEY` is missing.

## 🔐 Security considerations
- The API key lives only in `.env` on the server; it is never sent to the browser.
- Errors from the AI provider are sanitized before reaching the client.
- Input size is limited to prevent abuse.
- No database or persistent storage – all data stays in memory for the request.

## ⚠️ Current limitations
- Relies on a single external LLM provider; if the service is down the app returns demo data.
- No user accounts or task persistence.
- Only plain‑text task lists are supported.

## 📈 Future improvements
- Add optional user accounts to save plans.
- Support multiple AI providers with a plug‑in style config.
- Provide richer UI (drag‑and‑drop reordering, progress analytics).
- Offline fallback using a lightweight local model (when credits allow).

## 🌍 Why open innovation matters
LazyDesk’s model name and endpoint are fully configurable via environment variables. Developers can swap Groq for any compatible **open‑weight** model (e.g., Mistral, OpenAI’s `gpt‑4o‑mini`) without code changes, encouraging experimentation and transparency in AI‑powered tooling.

---

## 🏆 Slow and Steady Hackathon submission
**Project name:** LazyDesk – Your AI‑powered task declutterer

**How it helps:** By automating the mental effort of sorting and prioritising a chaotic to‑do list, LazyDesk reduces decision fatigue, letting participants focus on building rather than organising. The “Lazy Mode” further enforces a low‑stress workflow—perfect for a marathon hackathon where conserving mental energy is key.

---

*Happy hacking!*
