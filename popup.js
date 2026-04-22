const emailInput = document.getElementById('email');
const saveBtn    = document.getElementById('saveBtn');
const statusEl   = document.getElementById('status');

// ── Load saved email ──────────────────────────────────────────────────────
chrome.storage.sync.get('email', ({ email }) => {
  if (email) emailInput.value = email;
  loadUsage(!!email);
});

// ── Usage display ─────────────────────────────────────────────────────────
function loadUsage(hasEmail) {
  const WORD_LIMIT = hasEmail ? 10000 : 1000;
  const today = new Date().toISOString().slice(0, 10);

  chrome.storage.local.get('usage', ({ usage }) => {
    const u = (usage?.date === today) ? usage : { requests: 0, chars: 0 };
    const words = Math.round(u.chars / 5);
    const pct   = Math.min(100, Math.round(words / WORD_LIMIT * 100));

    document.getElementById('usageCount').textContent  = `${u.requests} zapytań`;
    document.getElementById('usageChars').textContent  = `~${words} słów`;
    document.getElementById('usageLimit').textContent  = `limit: ${WORD_LIMIT.toLocaleString()} słów/dzień`;

    const bar = document.getElementById('usageBar');
    bar.style.width = pct + '%';
    bar.className   = 'usage-bar-fill' + (pct >= 100 ? ' full' : pct >= 75 ? ' warn' : '');
  });
}

saveBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  chrome.storage.sync.set({ email }, () => {
    setStatus(email ? '✓ Zapisano z e-mailem (10 000 słów/dzień)' : '✓ Zapisano (1 000 słów/dzień)', false);
    loadUsage(!!email);
  });
});

function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.className = isError ? 'error' : '';
  if (!isError) setTimeout(() => { statusEl.textContent = ''; }, 3000);
}
