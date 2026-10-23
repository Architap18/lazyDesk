
document.addEventListener('DOMContentLoaded', () => {
  const tasksInput = document.getElementById('tasksInput');
  const lazyMode = document.getElementById('lazyMode');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultSection = document.getElementById('resultSection');
  const planContainer = document.getElementById('planContainer');
  const copyBtn = document.getElementById('copyBtn');
  const errorSection = document.getElementById('errorSection');
  const allTasksSection = document.getElementById('allTasksSection');
  const allTasksList = document.getElementById('allTasksList');

  let copyText = '';

  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function showError(message) {
    errorSection.textContent = message;
    errorSection.classList.remove('hidden');
  }

  function clearResults() {
    planContainer.replaceChildren();
    allTasksList.replaceChildren();
    resultSection.classList.add('hidden');
    allTasksSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    copyText = '';
  }

  function renderTaskCard(task, data) {
    const card = element('article', 'task-card');
    const row = element('div', 'task-top-row');
    const title = element('div', 'title', task);
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.setAttribute('aria-label', `Mark "${task}" complete`);

    checkbox.addEventListener('change', () => {
      title.style.textDecoration = checkbox.checked ? 'line-through' : 'none';
      title.style.opacity = checkbox.checked ? '0.6' : '1';
    });

    row.append(title, checkbox);
    card.appendChild(row);

    const meta = element('div', 'meta');
    const priority = data.priorities?.[task] || 'Medium';
    const estimate = data.effort?.[task] || '30m';

    meta.appendChild(
      element('span', `badge ${priority.toLowerCase()}`, priority)
    );
    meta.appendChild(element('span', '', `⏱ ${estimate}`));
    card.appendChild(meta);

    return card;
  }

  function renderAllTasks(data) {
    allTasksList.replaceChildren();

    const tasks = Array.isArray(data.organizedTasks)
      ? data.organizedTasks
      : (data.allTasks || []).map(task => ({
          task,
          category: 'Other',
          priority: data.priorities?.[task] || 'Medium',
          effort: data.effort?.[task] || '30m'
        }));

    const groups = new Map();

    tasks.forEach(item => {
      const category = item.category || 'Other';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(item);
    });

    for (const [category, items] of groups) {
      const group = element('div', 'all-task-group');
      const heading = element(
        'h3',
        'task-category',
        `${category} (${items.length})`
      );
      const list = element('div', 'category-task-list');

      items.forEach(item => {
        const li = element('div', 'all-task-item');
        li.appendChild(element('div', 'all-task-title', item.task));

        const meta = element('div', 'meta');
        const priority = item.priority || 'Medium';

        meta.appendChild(
          element('span', `badge ${priority.toLowerCase()}`, priority)
        );
        meta.appendChild(
          element('span', '', `⏱ ${item.effort || '30m'}`)
        );

        li.appendChild(meta);
        list.appendChild(li);
      });

      group.append(heading, list);
      allTasksList.appendChild(group);
    }

    allTasksSection.classList.remove('hidden');
  }

  function renderPlan(data) {
    clearResults();

    planContainer.appendChild(
      element('p', 'summary', data.summary || 'Your tasks are organized.')
    );

    planContainer.appendChild(element('h3', '', 'Top 3 Important Tasks'));

    const topList = element('ul', 'top-tasks-list');

    (data.importantTasks || []).forEach(task => {
      topList.appendChild(element('li', '', task));
    });

    planContainer.appendChild(topList);

    if (data.starterTask) {
      planContainer.appendChild(
        element('p', 'starter-task', `Start here: ${data.starterTask}`)
      );
    }

    planContainer.appendChild(element('h3', '', 'Your Daily Plan'));

    const dailyTasks = (data.dailyPlan || '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/\s+\((High|Medium|Low)\)$/i, ''));

    dailyTasks.forEach(task => {
      planContainer.appendChild(renderTaskCard(task, data));
    });

    renderAllTasks(data);

    copyText = [
      data.summary || '',
      '',
      'TOP 3 IMPORTANT TASKS',
      ...(data.importantTasks || []).map(task => `- ${task}`),
      '',
      'DAILY PLAN',
      ...dailyTasks.map((task, index) => `${index + 1}. ${task} — ${data.priorities?.[task] || 'Medium'}, ${data.effort?.[task] || '30m'}`),
      '',
      'ALL TASKS',
      ...(data.organizedTasks || []).map(item =>
        `- [${item.category}] ${item.task} — ${item.priority}, ${item.effort}`
      )
    ].join('\n');

    resultSection.classList.remove('hidden');
  }

  submitBtn.addEventListener('click', async () => {
    errorSection.classList.add('hidden');

    if (!tasksInput.value.trim()) {
      showError('Please enter your tasks.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Organizing...';

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasksInput.value,
          lazyMode: lazyMode.checked
        })
      });

      const result = await response.json();

      if (!response.ok) {
        showError(result.error || 'Unable to organize tasks.');
        return;
      }

      if (!result.data) {
        showError('The server returned no task data.');
        return;
      }

      renderPlan(result.data);
    } catch (error) {
      console.error('LazyDesk request failed:', error);
      showError('Network error. Check that the server is running.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Organize my chaos';
    }
  });

  resetBtn.addEventListener('click', () => {
    tasksInput.value = '';
    lazyMode.checked = false;
    clearResults();
  });

  copyBtn.addEventListener('click', async () => {
    if (!copyText) return;

    try {
      await navigator.clipboard.writeText(copyText);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy plan';
      }, 1500);
    } catch (error) {
      showError('Copy failed. Check your browser clipboard permissions.');
    }
  });
});
