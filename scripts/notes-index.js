// Search + topic filters for /notes/. The page works as a plain list without this script.
(() => {
  const root = document.querySelector('.notes-index');
  if (!root) return;
  const tools = root.querySelector('.notes-tools');
  const input = root.querySelector('#notes-q');
  const group = root.querySelector('.notes-topics');
  const bar = root.querySelector('.notes-topics-bar');
  const buttons = Array.from(group.querySelectorAll('button'));
  const list = root.querySelector('.notes-list');
  const count = root.querySelector('.notes-count');
  const empty = root.querySelector('.notes-empty');
  const rows = Array.from(list.children).map((li) => ({
    li,
    slug: li.dataset.slug,
    topic: li.dataset.topic,
    head: (li.textContent + ' ' + li.dataset.slug).toLowerCase(),
    body: '',
  }));
  let topic = '';
  let bodies = null;

  // Full note text is fetched once, on first use, so the page itself stays light.
  const loadBodies = () => (bodies ??= fetch('/notes/search.json')
    .then((r) => r.json())
    .then((all) => {
      const text = new Map(all.map((e) => [e.s, e.t.toLowerCase()]));
      rows.forEach((r) => { r.body = text.get(r.slug) || ''; });
      render();
    })
    .catch(() => {}));

  // Underline glides to the selected topic. A CSS transition restarts from wherever it is,
  // so rapid clicks retarget smoothly. Reduced motion zeroes the transition in styles.css.
  const moveBar = () => {
    const btn = buttons.find((b) => b.dataset.topic === topic);
    bar.style.width = btn.offsetWidth + 'px';
    bar.style.transform = `translateX(${btn.offsetLeft}px)`;
  };

  function render() {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const all = (s) => terms.every((t) => s.includes(t));
    const titleHits = [], textHits = [], misses = [];
    for (const r of rows) {
      const inTopic = !topic || r.topic === topic;
      if (inTopic && all(r.head)) titleHits.push(r.li);
      else if (inTopic && terms.length && all(r.head + ' ' + r.body)) textHits.push(r.li);
      else misses.push(r.li);
    }
    // Title and topic matches first, then notes that only match in their text. Manifest order within each.
    list.append(...titleHits, ...textHits, ...misses);
    titleHits.concat(textHits).forEach((li) => li.classList.remove('is-hidden'));
    misses.forEach((li) => li.classList.add('is-hidden'));

    const n = titleHits.length + textHits.length;
    count.textContent = `${n} note${n === 1 ? '' : 's'}`;
    empty.hidden = n > 0;
    root.querySelector('.notes-empty-q').textContent = input.value.trim();

    const url = new URL(location.href);
    q ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
    topic ? url.searchParams.set('topic', topic) : url.searchParams.delete('topic');
    history.replaceState(null, '', url);
  }

  function selectTopic(key) {
    topic = buttons.some((b) => b.dataset.topic === key) ? key : '';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.topic === topic)));
    moveBar();
    // On narrow screens the row scrolls sideways: keep the selected topic in view (horizontally only).
    const btn = buttons.find((b) => b.dataset.topic === topic);
    if (btn.offsetLeft < group.scrollLeft || btn.offsetLeft + btn.offsetWidth > group.scrollLeft + group.clientWidth) {
      group.scrollLeft = btn.offsetLeft - 24;
    }
  }

  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    selectTopic(btn.dataset.topic);
    render();
  });
  input.addEventListener('focus', loadBodies);
  input.addEventListener('input', () => { loadBodies(); render(); });
  root.querySelector('.notes-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });

  // "/" jumps to search, unless the reader is already typing somewhere.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    input.focus();
  });

  // Restore q and topic from the URL, so Back from a note lands on the same filtered list.
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  tools.hidden = false;
  selectTopic(params.get('topic') || '');
  if (input.value) loadBodies();
  render();
  requestAnimationFrame(() => bar.classList.add('is-ready'));
  addEventListener('resize', moveBar);
  document.fonts?.ready.then(moveBar);
})();
