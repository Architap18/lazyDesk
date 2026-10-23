document.addEventListener('DOMContentLoaded', () => {
  const tasksInput = document.getElementById('tasksInput');
  const lazyMode = document.getElementById('lazyMode');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultSection = document.getElementById('resultSection');
  const planContainer = document.getElementById('planContainer');
  const copyBtn = document.getElementById('copyBtn');
  const errorSection = document.getElementById('errorSection');

  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Organizing...' : 'Organize my chaos';
  };

  const showError = (msg) => {
    errorSection.textContent = msg;
    errorSection.classList.remove('hidden');
    setTimeout(() => {
      errorSection.classList.add('hidden');
    }, 5000);
  };

  const clearResult = () => {
    planContainer.innerHTML = '';
    resultSection.classList.add('hidden');
  };

  const renderPlan = (data) => {
    clearResult();
    const { summary, importantTasks, categories, priorities, effort, starterTask, dailyPlan } = data;
    const fragment = document.createDocumentFragment();

    // Summary
    const summaryEl = document.createElement('p');
    summaryEl.textContent = summary;
    summaryEl.style.fontWeight = '500';
    fragment.appendChild(summaryEl);

    // Important tasks list
    const impHeader = document.createElement('h3');
    impHeader.textContent = 'Top 3 Important Tasks';
    fragment.appendChild(impHeader);
    const impList = document.createElement('ul');
    importantTasks.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      impList.appendChild(li);
    });
    fragment.appendChild(impList);

    // Daily plan lines
    const planHeader = document.createElement('h3');
    planHeader.textContent = 'Your Daily Plan';
    fragment.appendChild(planHeader);
    const lines = dailyPlan.split('\n').filter(l => l.trim() !== '');
    lines.forEach(line => {
      const card = document.createElement('div');
      card.className = 'task-card';
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = line;

      const meta = document.createElement('div');
      meta.className = 'meta';

      // Extract task name from line (assumes format "1. Task (Priority)" or similar)
      const match = line.match(/\d+\.\s*(.*?)(?:\s*\((High|Medium|Low)\))?$/i);
      let taskName = match ? match[1].trim() : line.trim();
      const priority = match && match[2] ? match[2] : priorities[taskName];
      const est = effort[taskName];

      if (priority) {
        const badge = document.createElement('span');
        badge.className = `badge ${priority.toLowerCase()}`;
        badge.textContent = priority;
        meta.appendChild(badge);
      }
      if (est) {
        const estSpan = document.createElement('span');
        estSpan.textContent = `⏱ ${est}`;
        meta.appendChild(estSpan);
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('aria-label', `Mark "${taskName}" as completed`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          title.style.textDecoration = 'line-through';
          title.style.opacity = '0.6';
        } else {
          title.style.textDecoration = 'none';
          title.style.opacity = '1';
        }
      });

      const topRow = document.createElement('div');
      topRow.style.display = 'flex';
      topRow.style.alignItems = 'center';
      topRow.style.justifyContent = 'space-between';
      topRow.appendChild(title);
      topRow.appendChild(checkbox);

      card.appendChild(topRow);
      if (meta.childElementCount) card.appendChild(meta);
      fragment.appendChild(card);
    });

    planContainer.appendChild(fragment);
    resultSection.classList.remove('hidden');
  };

  submitBtn.addEventListener('click', async () => {
    const tasks = tasksInput.value.trim();
    if (!tasks) {
      showError('Please enter your tasks.');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, lazyMode: lazyMode.checked })
      });
      const json = await resp.json();
      if (!resp.ok) {
        showError(json.error || 'Server error');
        setLoading(false);
        return;
      }
      const data = json.data;
      renderPlan(data);
    } catch (e) {
      console.error(e);
      showError('Network error');
    } finally {
      setLoading(false);
    }
  });

  resetBtn.addEventListener('click', () => {
    tasksInput.value = '';
    lazyMode.checked = false;
    clearResult();
  });

  copyBtn.addEventListener('click', () => {
    const text = Array.from(planContainer.querySelectorAll('.title'))
      .map(el => el.textContent)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy plan'), 2000);
    });
  });
});
