import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Helper to generate demo data
function getDemoResponse() {
  return {
    summary: "You have a mix of work and personal tasks.",
    importantTasks: [
      "Finish project report",
      "Buy groceries",
      "Schedule doctor appointment"
    ],
    categories: {
      "Work": ["Finish project report", "Email client", "Update spreadsheet"],
      "Personal": ["Buy groceries", "Call Mom", "Read a book"]
    },
    priorities: {
      "Finish project report": "High",
      "Buy groceries": "Medium",
      "Schedule doctor appointment": "Low"
    },
    effort: {
      "Finish project report": "3h",
      "Buy groceries": "30m",
      "Schedule doctor appointment": "15m"
    },
    starterTask: "Buy groceries",
    dailyPlan: "1. Finish project report (High)\n2. Buy groceries (Medium)\n3. Call Mom (Low)"
  };
}

router.post('/', async (req, res) => {
  const { tasks, lazyMode } = req.body;
  if (!tasks || typeof tasks !== 'string' || tasks.trim().length === 0) {
    return res.status(400).json({ error: 'Task list is required.' });
  }
  if (tasks.length > 2000) {
    return res.status(400).json({ error: 'Task list is too long (max 2000 characters).' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192';

  // If no API key, return demo response
  if (!apiKey) {
    console.warn('GROQ_API_KEY not set, returning demo response.');
    const demo = getDemoResponse();
    return res.json({ demo: true, data: demo });
  }

  const systemPrompt = `You are an assistant that organizes a user's free‑form task list.
Return a JSON object with the following exact keys:
  summary (short string),
  importantTasks (array of three strings),
  categories (object mapping category names to arrays of tasks),
  priorities (object mapping each task string to "High", "Medium" or "Low"),
  effort (object mapping each task to an estimated effort like "30m" or "2h"),
  starterTask (one task string that is easiest to begin),
  dailyPlan (a short multi‑line string of up to 5 tasks).
If the user enabled Lazy Mode, limit the dailyPlan to three tasks and ensure the starterTask is included.
Be concise and use the original wording of tasks where possible.
`;  

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: tasks }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    stream: false
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service error', details: errText });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content?.trim();
    if (!aiMessage) {
      return res.status(500).json({ error: 'Empty response from AI.' });
    }
    let parsed;
    try {
      parsed = JSON.parse(aiMessage);
    } catch (e) {
      console.error('Failed to parse AI JSON:', e, aiMessage);
      return res.status(500).json({ error: 'Malformed AI response.', raw: aiMessage });
    }
    // Basic validation of required fields
    const required = ['summary','importantTasks','categories','priorities','effort','starterTask','dailyPlan'];
    for (const key of required) {
      if (!(key in parsed)) {
        return res.status(500).json({ error: `Missing key ${key} in AI response.` });
      }
    }
    res.json({ demo: false, data: parsed, lazyMode: !!lazyMode });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
