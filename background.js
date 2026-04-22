async function trackUsage(chars) {
  const today = new Date().toISOString().slice(0, 10);
  const store = await chrome.storage.local.get('usage');
  const usage = (store.usage?.date === today)
    ? store.usage
    : { date: today, requests: 0, chars: 0 };
  usage.requests += 1;
  usage.chars += chars;
  await chrome.storage.local.set({ usage });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'translate') return false;

  (async () => {
    try {
      const { email } = await chrome.storage.sync.get('email');

      const params = new URLSearchParams({
        q: message.text,
        langpair: 'zh|en'
      });
      if (email) params.set('de', email);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://api.mymemory.translated.net/get?${params}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) {
        sendResponse({ error: `HTTP ${res.status}` });
        return;
      }

      const data = await res.json();

      if (data.responseStatus !== 200) {
        sendResponse({ error: data.responseDetails || 'Błąd MyMemory' });
        return;
      }

      const translation = data.responseData?.translatedText;
      if (translation) {
        await trackUsage(message.text.length);
        sendResponse({ translation: translation.trim() });
      } else {
        sendResponse({ error: 'Brak tłumaczenia w odpowiedzi.' });
      }
    } catch (e) {
      sendResponse({ error: e.name === 'AbortError' ? 'Timeout' : e.message });
    }
  })();

  return true;
});
