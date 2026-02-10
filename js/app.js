(function () {
  const STORAGE_KEYS = {
    solved: 'dsa_tracker_solved',
    streak: 'dsa_tracker_streak',
    lastVisit: 'dsa_tracker_last_visit',
  };

  let questions = [];
  let solvedSet = new Set();

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.solved);
      if (raw) {
        const arr = JSON.parse(raw);
        solvedSet = new Set(Array.isArray(arr) ? arr : []);
      }
    } catch (_) {
      solvedSet = new Set();
    }
  }

  function saveSolved() {
    localStorage.setItem(STORAGE_KEYS.solved, JSON.stringify([...solvedSet]));
  }

  function updateStreak() {
    const today = todayStr();
    let streak = parseInt(localStorage.getItem(STORAGE_KEYS.streak) || '0', 10);
    const last = localStorage.getItem(STORAGE_KEYS.lastVisit) || '';

    if (!last) {
      streak = 0;
    } else {
      const lastDate = new Date(last);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // already visited today, keep streak
      } else if (diffDays === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
    }

    localStorage.setItem(STORAGE_KEYS.streak, String(streak));
    localStorage.setItem(STORAGE_KEYS.lastVisit, today);
    return streak;
  }

  function getStreak() {
    return parseInt(localStorage.getItem(STORAGE_KEYS.streak) || '0', 10);
  }

  function renderStats() {
    const total = questions.length;
    const solved = solvedSet.size;
    const percent = total ? Math.round((solved / total) * 100) : 0;
    const streak = getStreak();

    document.getElementById('totalCount').textContent = total;
    document.getElementById('solvedCount').textContent = solved;
    document.getElementById('percentDone').textContent = percent + '%';
    document.getElementById('streakCount').textContent = streak;

    const last = localStorage.getItem(STORAGE_KEYS.lastVisit);
    document.getElementById('lastVisit').textContent = last || '—';
  }

  function getTopicOptions() {
    const set = new Set();
    questions.forEach((q) => set.add(q.topic));
    return [...set].filter(Boolean).sort();
  }

  function getSubTopicOptions(topic) {
    const set = new Set();
    questions
      .filter((q) => !topic || q.topic === topic)
      .forEach((q) => set.add(q.subTopic));
    return [...set].filter(Boolean).sort();
  }

  function fillTopicFilter() {
    const sel = document.getElementById('topicFilter');
    const subs = document.getElementById('subTopicFilter');
    const topics = getTopicOptions();
    sel.innerHTML = '<option value="">All topics</option>' + topics.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');

    sel.addEventListener('change', () => {
      const topic = sel.value;
      const subOpts = getSubTopicOptions(topic);
      subs.innerHTML = '<option value="">All sub-topics</option>' + subOpts.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
      renderQuestions();
    });
  }

  function fillSubTopicFilter() {
    const subSel = document.getElementById('subTopicFilter');
    const subOpts = getSubTopicOptions('');
    subSel.innerHTML = '<option value="">All sub-topics</option>' + subOpts.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

    subSel.addEventListener('change', () => renderQuestions());
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getFilteredQuestions() {
    const topic = document.getElementById('topicFilter').value;
    const subTopic = document.getElementById('subTopicFilter').value;
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('search').value.trim().toLowerCase();

    return questions.filter((q) => {
      if (topic && q.topic !== topic) return false;
      if (subTopic && q.subTopic !== subTopic) return false;
      if (status === 'solved' && !solvedSet.has(q.id)) return false;
      if (status === 'unsolved' && solvedSet.has(q.id)) return false;
      if (search && !(q.questionName || '').toLowerCase().includes(search) && !(q.topic || '').toLowerCase().includes(search) && !(q.subTopic || '').toLowerCase().includes(search)) return false;
      return true;
    });
  }

  function renderQuestions() {
    const list = document.getElementById('questionsList');
    const empty = document.getElementById('emptyState');
    const filtered = getFilteredQuestions();

    if (filtered.length === 0) {
      list.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.innerHTML = filtered
      .map(
        (q) => {
          const solved = solvedSet.has(q.id);
          const name = escapeHtml(q.questionName || '');
          const tag = [q.topic, q.subTopic].filter(Boolean).join(' · ');
          const link = (q.questionLink || '').trim();
          const solution = (q.javaSolution || '').trim();
          const hasLink = link && link.startsWith('http');
          const solutionIsUrl = solution && solution.startsWith('http');
          const hasSolutionPath = solution && !solutionIsUrl;
          return `
<li class="question-item${solved ? ' solved' : ''}" data-id="${q.id}">
  <button type="button" class="question-check" aria-label="${solved ? 'Mark unsolved' : 'Mark solved'}" title="${solved ? 'Mark unsolved' : 'Mark solved'}">
    ${solved ? '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M10 3L4.5 8.5 2 6"/></svg>' : ''}
  </button>
  <div class="question-meta">
    <p class="question-name">${name}</p>
    <span class="question-topic-tag">${escapeHtml(tag)}</span>
  </div>
  <div class="question-links">
    ${hasLink ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener">Problem</a>` : ''}
    ${solutionIsUrl ? `<a href="${escapeHtml(solution)}" target="_blank" rel="noopener" title="Solution">Code</a>` : hasSolutionPath ? `<span class="solution-path" title="${escapeHtml(solution)}">Code</span>` : ''}
  </div>
</li>`;
        }
      )
      .join('');

    list.querySelectorAll('.question-check').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.question-item');
        const id = parseInt(item.dataset.id, 10);
        if (solvedSet.has(id)) {
          solvedSet.delete(id);
        } else {
          solvedSet.add(id);
        }
        saveSolved();
        item.classList.toggle('solved', solvedSet.has(id));
        item.querySelector('.question-check').innerHTML = solvedSet.has(id) ? '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M10 3L4.5 8.5 2 6"/></svg>' : '';
        item.querySelector('.question-check').setAttribute('aria-label', solvedSet.has(id) ? 'Mark unsolved' : 'Mark solved');
        item.querySelector('.question-check').setAttribute('title', solvedSet.has(id) ? 'Mark unsolved' : 'Mark solved');
        renderStats();
      });
    });
  }

  function bindFilters() {
    document.getElementById('statusFilter').addEventListener('change', renderQuestions);
    document.getElementById('search').addEventListener('input', debounce(renderQuestions, 200));
  }

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('topicFilter').value = '';
    document.getElementById('subTopicFilter').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('search').value = '';
    const subOpts = getSubTopicOptions('');
    document.getElementById('subTopicFilter').innerHTML = '<option value="">All sub-topics</option>' + subOpts.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    renderQuestions();
  });

  document.getElementById('resetStreak').addEventListener('click', () => {
    if (confirm('Reset your streak to 0?')) {
      localStorage.setItem(STORAGE_KEYS.streak, '0');
      renderStats();
    }
  });

  document.getElementById('markAllUnsolved').addEventListener('click', () => {
    const filtered = getFilteredQuestions();
    if (!filtered.length) return;
    if (!confirm(`Mark ${filtered.length} visible question(s) as unsolved?`)) return;
    filtered.forEach((q) => solvedSet.delete(q.id));
    saveSolved();
    renderQuestions();
    renderStats();
    if (currentView === 'map') renderMap();
    if (currentView === 'path') renderPath();
  });

  let currentView = 'list';
  const listViewEl = document.getElementById('listView');
  const mapViewEl = document.getElementById('mapView');
  const pathViewEl = document.getElementById('pathView');
  const tooltipEl = document.getElementById('mapTooltip');

  document.getElementById('viewList').addEventListener('click', () => switchView('list'));
  document.getElementById('viewMap').addEventListener('click', () => switchView('map'));
  document.getElementById('viewPath').addEventListener('click', () => switchView('path'));

  function switchView(view) {
    currentView = view;
    document.getElementById('viewList').classList.toggle('active', view === 'list');
    document.getElementById('viewMap').classList.toggle('active', view === 'map');
    document.getElementById('viewPath').classList.toggle('active', view === 'path');
    document.getElementById('viewList').setAttribute('aria-pressed', view === 'list');
    document.getElementById('viewMap').setAttribute('aria-pressed', view === 'map');
    document.getElementById('viewPath').setAttribute('aria-pressed', view === 'path');
    listViewEl.hidden = view !== 'list';
    mapViewEl.hidden = view !== 'map';
    pathViewEl.hidden = view !== 'path';
    if (view === 'map') renderMap();
    if (view === 'path') renderPath();
  }

  function jumpToTopic(topic) {
    document.getElementById('topicFilter').value = topic || '';
    const subOpts = getSubTopicOptions(topic);
    const subSel = document.getElementById('subTopicFilter');
    subSel.innerHTML = '<option value="">All sub-topics</option>' + subOpts.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('search').value = '';
    switchView('list');
    renderQuestions();
  }

  function getTopicsWithSubtopics() {
    const order = {};
    let idx = 0;
    questions.forEach((q) => {
      const t = q.topic || 'Other';
      if (order[t] === undefined) order[t] = idx++;
    });
    const byTopic = {};
    questions.forEach((q) => {
      const t = q.topic || 'Other';
      if (!byTopic[t]) byTopic[t] = {};
      const st = q.subTopic || '—';
      if (!byTopic[t][st]) byTopic[t][st] = [];
      byTopic[t][st].push(q);
    });
    return Object.keys(byTopic)
      .sort((a, b) => order[a] - order[b])
      .map((topic) => {
        const subMap = byTopic[topic];
        const subTopics = Object.keys(subMap)
          .sort()
          .map((subTopic) => {
            const list = subMap[subTopic];
            const solved = list.filter((q) => solvedSet.has(q.id)).length;
            return { subTopic, list, solved, total: list.length };
          });
        const total = subTopics.reduce((s, st) => s + st.total, 0);
        const totalSolved = subTopics.reduce((s, st) => s + st.solved, 0);
        const pct = total ? Math.round((totalSolved / total) * 100) : 0;
        return { topic, subTopics, total, totalSolved, pct };
      });
  }

  function getSuggestedNextTopic() {
    const path = getTopicsWithSubtopics();
    return path.find((p) => p.pct < 100) || null;
  }

  function renderPath() {
    const suggestedEl = document.getElementById('pathSuggestedNext');
    const contentEl = document.getElementById('pathContent');
    const path = getTopicsWithSubtopics();
    const suggested = getSuggestedNextTopic();

    if (suggested) {
      suggestedEl.innerHTML = `
        <span class="path-suggested-label">Suggested next</span>
        <strong class="path-suggested-topic">${escapeHtml(suggested.topic)}</strong>
        <span class="path-suggested-meta">${suggested.totalSolved}/${suggested.total} (${suggested.pct}%)</span>
        <button type="button" class="btn path-jump-btn" data-topic="${escapeHtml(suggested.topic)}">Jump to topic →</button>
      `;
      suggestedEl.hidden = false;
      suggestedEl.querySelector('.path-jump-btn').addEventListener('click', () => jumpToTopic(suggested.topic));
    } else {
      suggestedEl.innerHTML = '<span class="path-suggested-label">All topics have progress. Pick any to revise or continue.</span>';
      suggestedEl.hidden = false;
    }

    contentEl.innerHTML = path
      .map(({ topic, subTopics, total, totalSolved, pct }, i) => {
        const isComplete = pct === 100;
        const isSuggested = suggested && suggested.topic === topic;
        const subRows = subTopics
          .map(
            (st) => {
            const stPct = st.total ? Math.round((st.solved / st.total) * 100) : 0;
            return `
  <div class="path-subtopic-row">
    <span class="path-subtopic-name">${escapeHtml(st.subTopic)}</span>
    <span class="path-subtopic-count">${st.solved}/${st.total}</span>
    <div class="path-subtopic-bar"><div class="path-subtopic-fill" style="width:${stPct}%"></div></div>
  </div>`;
          }
          )
          .join('');
        return `
<div class="path-card ${isComplete ? 'path-card-done' : ''} ${isSuggested ? 'path-card-suggested' : ''}" data-topic="${escapeHtml(topic)}">
  <div class="path-card-head">
    <span class="path-card-step">${i + 1}</span>
    <div class="path-card-title-wrap">
      <h3 class="path-card-title">${escapeHtml(topic)}</h3>
      <span class="path-card-meta">${totalSolved} / ${total} (${pct}%)</span>
    </div>
    <div class="path-card-progress">
      <div class="path-card-bar"><div class="path-card-fill" style="width:${pct}%"></div></div>
    </div>
  </div>
  <div class="path-subtopics">${subRows}</div>
  <button type="button" class="path-card-jump" data-topic="${escapeHtml(topic)}">Go to questions →</button>
</div>
<div class="path-connector" aria-hidden="true"></div>`;
      })
      .join('');

    contentEl.querySelectorAll('.path-card').forEach((card) => {
      const topic = card.dataset.topic;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.path-card-jump')) return;
        jumpToTopic(topic);
      });
    });
    contentEl.querySelectorAll('.path-card-jump').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        jumpToTopic(btn.dataset.topic);
      });
    });
  }

  function getQuestionsByTopic() {
    const byTopic = {};
    questions.forEach((q) => {
      const t = q.topic || 'Other';
      if (!byTopic[t]) byTopic[t] = [];
      byTopic[t].push(q);
    });
    return Object.keys(byTopic)
      .sort()
      .map((topic) => ({ topic, list: byTopic[topic] }));
  }

  function renderMap() {
    const overview = document.getElementById('mapOverview');
    const sections = document.getElementById('mapSections');
    const byTopic = getQuestionsByTopic();

    overview.innerHTML = byTopic
      .map(({ topic, list }) => {
        const solved = list.filter((q) => solvedSet.has(q.id)).length;
        const pct = list.length ? Math.round((solved / list.length) * 100) : 0;
        return `
<div class="map-overview-card">
  <h4>${escapeHtml(topic)}</h4>
  <p>${solved} / ${list.length} (${pct}%)</p>
  <div class="map-overview-bar"><div class="map-overview-fill" style="width:${pct}%"></div></div>
</div>`;
      })
      .join('');

    sections.innerHTML = byTopic
      .map(({ topic, list }) => {
        const solvedCount = list.filter((q) => solvedSet.has(q.id)).length;
        const pct = list.length ? Math.round((solvedCount / list.length) * 100) : 0;
        const dots = list
          .map(
            (q) => {
              const solved = solvedSet.has(q.id);
              const name = escapeHtml(q.questionName || '');
              const tag = escapeHtml([q.topic, q.subTopic].filter(Boolean).join(' · '));
              return `<button type="button" class="map-dot ${solved ? 'solved' : 'unsolved'}" data-id="${q.id}" data-name="${name}" data-tag="${tag}" title="${name}"> </button>`;
            }
          )
          .join('');
        return `
<div class="map-section">
  <div class="map-section-title">${escapeHtml(topic)} <span style="font-weight:400;">${list.length} questions · ${solvedCount}/${list.length} done</span></div>
  <div class="map-section-bar"><div class="map-section-fill" style="width:${pct}%"></div></div>
  <div class="map-grid">${dots}</div>
</div>`;
      })
      .join('');

    sections.querySelectorAll('.map-dot').forEach((el) => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id, 10);
        if (solvedSet.has(id)) solvedSet.delete(id);
        else solvedSet.add(id);
        saveSolved();
        el.classList.toggle('solved', solvedSet.has(id));
        el.classList.toggle('unsolved', !solvedSet.has(id));
        renderStats();
        renderMap();
      });
      el.addEventListener('mouseenter', (e) => {
        const name = el.dataset.name || '';
        const tag = el.dataset.tag || '';
        tooltipEl.textContent = tag ? `${name} (${tag})` : name;
        tooltipEl.classList.add('visible');
        updateTooltipPos(e);
      });
      el.addEventListener('mousemove', updateTooltipPos);
      el.addEventListener('mouseleave', () => tooltipEl.classList.remove('visible'));
    });

    function updateTooltipPos(e) {
      const x = e.clientX;
      const y = e.clientY;
      const gap = 10;
      const rect = tooltipEl.getBoundingClientRect();
      let left = x + gap;
      let top = y + gap;
      if (left + rect.width > window.innerWidth) left = x - rect.width - gap;
      if (top + rect.height > window.innerHeight) top = y - rect.height - gap;
      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top = top + 'px';
    }
  }
  
  function init() {
    loadStored();
    updateStreak();

    fetch('data/questions.json')
      .then((r) => r.json())
      .then((data) => {
        questions = Array.isArray(data) ? data : [];
        fillTopicFilter();
        fillSubTopicFilter();
        bindFilters();
        renderQuestions();
        renderStats();
      })
      .catch((err) => {
        document.getElementById('questionsList').innerHTML = '<li class="empty-state">Failed to load questions. Make sure <code>data/questions.json</code> is available.</li>';
        document.getElementById('emptyState').hidden = true;
      });
  }

  init();
})();
