# LazyDesk 🦥

**Do less. Make progress.**

LazyDesk turns messy to-do lists into organized, manageable daily plans, helping reduce decision fatigue and focus on what matters.

## ✨ Features

- Turn free-form task lists into organized tasks
- Categorize tasks and assign priorities
- Estimate effort and highlight the Top 3 tasks
- Generate a manageable daily plan
- **Lazy Mode** — focus on just 3 tasks
- Copy plans and track task completion
- Demo mode when no API key is configured

## 🛠 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **AI:** Optional Groq API with a configurable model
- **Fallback:** Rule-based task organization

## 🚀 Getting Started

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd lazy-desk
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Add your `GROQ_API_KEY` to `.env` if using the optional AI integration. Never commit your `.env` file.

## 🌍 Why Open Innovation?

LazyDesk keeps its AI integration configurable, making it easier to experiment with compatible model providers. Its rule-based fallback keeps task organization available when AI is unavailable.
