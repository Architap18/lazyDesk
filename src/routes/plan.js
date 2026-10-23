
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

function parseTasks(input) {
  return input
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function analyzeTask(task) {
  const text = task.toLowerCase();
  let category = 'Personal';
  let priority = 'Low';
  let effort = '15m';
  let score = 20;

  // Check specific categories before broad categories.
  if (/\bhackathon\b|\bslow and steady\b/.test(text)) {
    category = 'Hackathon';
  } else if (/\b(dbms|sql|prisma|exam|study|revise|revision|assignment|notes|normalization|migration|syllabus)\b/.test(text)) {
    category = 'Academics';
  } else if (/\b(github|network error|debug|coding|deploy|server|api|bug|fix|push|commit|repository|repo|lazydesk|software|code)\b/.test(text)) {
    category = 'Development & Tech';
  } else if (/\b(resume|cv|internship|job|career|portfolio)\b/.test(text)) {
    category = 'Career';
  }

  // Deadlines receive the highest priority.
  if (/\b(overdue|due today|due tomorrow|deadline|urgent|asap)\b/.test(text)) {
    priority = 'High';
    effort = '1h';
    score = 100;
  } else if (/\b(network error|crash|broken|blocking bug)\b/.test(text)) {
    priority = 'High';
    effort = '1h';
    score = 90;
  } else if (
    category === 'Hackathon' &&
    /\b(submit|submission|deadline)\b/.test(text)
  ) {
    priority = 'High';
    effort = '1h';
    score = 85;
  } else if (/\b(finish|complete|fix|push|submit)\b/.test(text)) {
    priority = 'High';
    effort = '1h';
    score = 75;
  } else if (/\b(revise|prepare|update|reply|return|call|notes|migration)\b/.test(text)) {
    priority = 'Medium';
    effort = '30m';
    score = 45;
  }

  // "Tonight" alone is not enough to make a personal call urgent.
  if (/\bcall mom\b/.test(text) && !/\b(urgent|due today|overdue)\b/.test(text)) {
    priority = 'Medium';
    effort = '15m';
    score = 35;
  }

  // Quick errands should not outrank deadlines.
  if (/\b(buy shampoo|groceries|clean my desk)\b/.test(text) &&
      !/\b(urgent|due today|due tomorrow|overdue)\b/.test(text)) {
    priority = 'Low';
    effort = '15m';
    score = 15;
  }

  // Updating a repository matters, but does not automatically outrank
  // a deadline or an actual project failure.
  if (/\bpush\b/.test(text) && /\bgithub\b/.test(text) &&
      !/\b(urgent|due today|due tomorrow|overdue)\b/.test(text)) {
    priority = 'Medium';
    effort = '30m';
    score = 60;
  }

  return { task, category, priority, effort, score };
}

function organizeTasks(input, lazyMode = false) {
  const tasks = parseTasks(input);
  const analyzed = tasks.map(analyzeTask);

  // Stable ranking: tasks with equal scores retain input order.
  const ranked = analyzed
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const categories = {};
  const priorities = {};
  const effort = {};

  for (const item of analyzed) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item.task);
    priorities[item.task] = item.priority;
    effort[item.task] = item.effort;
  }

  const importantTasks = ranked
    .slice(0, Math.min(3, ranked.length))
    .map(item => item.task);

  const dailyTasks = ranked.slice(
    0,
    lazyMode ? Math.min(3, ranked.length) : Math.min(5, ranked.length)
  );

  return {
    summary: `You have ${tasks.length} tasks organized into ${Object.keys(categories).length} categories.`,
    allTasks: tasks,
    organizedTasks: analyzed.map(({ score, ...item }) => item),
    categories,
    priorities,
    effort,
    importantTasks,
    starterTask: dailyTasks[0]?.task || '',
    dailyPlan: dailyTasks
      .map((item, index) => `${index + 1}. ${item.task} (${item.priority})`)
      .join('\n')
  };
}

router.post('/', async (req, res) => {
  const { tasks, lazyMode = false } = req.body || {};

  if (typeof tasks !== 'string' || !tasks.trim()) {
    return res.status(400).json({ error: 'Please enter your tasks.' });
  }

  if (tasks.length > 2000) {
    return res.status(400).json({
      error: 'Task list is too long (maximum 2000 characters).'
    });
  }

  const taskList = parseTasks(tasks);

  if (!taskList.length) {
    return res.status(400).json({ error: 'Please enter at least one task.' });
  }

  const data = organizeTasks(tasks, Boolean(lazyMode));
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  // Always keep the app usable without an API key.
  if (!apiKey) {
    return res.json({ demo: true, data, lazyMode: Boolean(lazyMode) });
  }

  // The deterministic result is the safe fallback if the AI is unavailable.
  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a task organization assistant. Briefly improve the summary only. Return JSON with one string property named summary. Do not invent, delete, or rewrite tasks.'
            },
            {
              role: 'user',
              content: JSON.stringify({ tasks: taskList })
            }
          ],
          temperature: 0.2,
          max_tokens: 150,
          stream: false
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      console.error('Groq API status:', response.status);
      return res.json({
        demo: true,
        fallback: true,
        data,
        lazyMode: Boolean(lazyMode)
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (content) {
      try {
        const aiSummary = JSON.parse(
          content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
        ).summary;

        if (typeof aiSummary === 'string' && aiSummary.trim()) {
          data.summary = aiSummary;
        }
      } catch {
        // Keep the deterministic summary if AI output is invalid.
      }
    }

    return res.json({ demo: false, data, lazyMode: Boolean(lazyMode) });
  } catch (error) {
    console.error('Groq unavailable; using fallback:', error.message);
    return res.json({
      demo: true,
      fallback: true,
      data,
      lazyMode: Boolean(lazyMode)
    });
  }
});

export default router;
