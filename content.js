(() => {
  const HOVER_DELAY_MS = 700;
  const MAX_TEXT_LEN = 300;
  const CHINESE_RE = /[\u4E00-\u9FFF]/;
  const TOOLTIP_ID = '__cn_translator_tooltip__';
  const BLOCK_TAGS = new Set(['P', 'LI', 'TD', 'TH', 'BLOCKQUOTE', 'PRE',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'FIGCAPTION']);

  let hoverTimer = null;
  let tooltip = null;
  let lastContainer = null;
  let cursorX = 0;
  let cursorY = 0;
  let translating = false;

  // ── Cache ─────────────────────────────────────────────────────────────────
  const cache = new Map(); // text → translation

  // ── Tooltip ───────────────────────────────────────────────────────────────

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    Object.assign(tooltip.style, {
      position:      'absolute',
      maxWidth:      '420px',
      minWidth:      '180px',
      padding:       '10px 14px',
      background:    '#1a1a2e',
      color:         '#e8e8f0',
      border:        '1px solid #4a4a7a',
      borderRadius:  '8px',
      fontSize:      '16px',
      lineHeight:    '1.65',
      boxShadow:     '0 6px 24px rgba(0,0,0,0.45)',
      zIndex:        '2147483647',
      display:       'none',
      wordBreak:     'break-word',
      pointerEvents: 'none',
      fontFamily:    'system-ui, sans-serif',
      whiteSpace:    'pre-wrap'
    });
    document.documentElement.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(text, clientX, clientY) {
    const t = ensureTooltip();
    const OFFSET = 16;

    t.textContent = text;
    t.style.visibility = 'hidden';
    t.style.display = 'block';

    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = clientX + OFFSET;
    let top  = clientY + OFFSET;

    if (left + tw > vw - 8) left = clientX - tw - OFFSET;
    if (top  + th > vh - 8) top  = clientY - th - OFFSET;
    if (left < 8) left = 8;
    if (top  < 8) top  = 8;

    t.style.left       = (left + window.scrollX) + 'px';
    t.style.top        = (top  + window.scrollY) + 'px';
    t.style.visibility = 'visible';
  }

  function updateTooltip(text) {
    if (!tooltip || tooltip.style.display === 'none') return;
    tooltip.textContent = text;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  function getContainer(el) {
    let cur = el;
    while (cur && cur !== document.body) {
      if (BLOCK_TAGS.has(cur.tagName)) return cur;
      if (cur.tagName === 'SPAN' || cur.tagName === 'A') {
        const txt = (cur.innerText || '').trim();
        if (txt.length > 0 && txt.length < 300) return cur;
      }
      cur = cur.parentElement;
    }
    return el;
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  document.addEventListener('mousemove', (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (target === tooltip || (tooltip && tooltip.contains(target))) return;

    const container = getContainer(target);
    if (container === lastContainer) return;

    clearTimeout(hoverTimer);
    hideTooltip();
    lastContainer = container;

    const rawText = (container.innerText || container.textContent || '').trim();
    if (!rawText || !CHINESE_RE.test(rawText)) return;

    const text = rawText.slice(0, MAX_TEXT_LEN);

    hoverTimer = setTimeout(() => {
      // Cached — show instantly, no API call
      if (cache.has(text)) {
        showTooltip(cache.get(text), cursorX, cursorY);
        return;
      }

      if (translating) return;
      translating = true;

      const msgTimeout = setTimeout(() => {
        translating = false;
        updateTooltip('❌ Timeout');
      }, 15000);

      chrome.runtime.sendMessage({ action: 'translate', text }, (response) => {
        clearTimeout(msgTimeout);
        translating = false;

        if (chrome.runtime.lastError) {
          updateTooltip('❌ ' + chrome.runtime.lastError.message);
          return;
        }

        if (response?.translation) {
          cache.set(text, response.translation);
          showTooltip(response.translation, cursorX, cursorY);
        } else {
          showTooltip('❌ ' + (response?.error || 'Błąd'), cursorX, cursorY);
        }
      });
    }, HOVER_DELAY_MS);
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target === tooltip || (tooltip && tooltip.contains(e.target))) return;
    const related = e.relatedTarget;
    if (related && lastContainer && lastContainer.contains(related)) return;

    clearTimeout(hoverTimer);
    hideTooltip();
    lastContainer = null;
  }, { passive: true });
})();
