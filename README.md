# 🀄 Chinese Text Translator – Chrome Extension

A Chrome extension that translates Chinese text to English on hover using the [MyMemory](https://mymemory.translated.net/) free translation API. No API key required.

## Features

- Hover over any Chinese text for **0.7 seconds** → instant English translation tooltip
- **Zero setup** – works out of the box, no account needed
- Translation **cache** – same text is never translated twice per session
- Daily **usage counter** with visual progress bar
- Optional email for higher daily limit (10 000 words vs 1 000)

## Installation

> Chrome Web Store submission is pending. Install manually for now.

1. Download or clone this repository
2. Open Chrome → go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `chinese-translator-extension` folder
5. The extension icon appears in your toolbar – you're ready to go

## Usage

Navigate to any page with Chinese text, hover over it and hold still for 0.7 s – a tooltip will appear with the English translation.

To increase your daily limit, open the extension popup and enter your email address (no registration required).

## Settings

Click the extension icon to open the settings popup:

| Setting | Description |
|---|---|
| Email (optional) | Raises daily limit from 1 000 to 10 000 words |
| Usage bar | Shows today's translated word count vs. daily limit |

## Daily Limits (MyMemory free tier)

| Mode | Limit |
|---|---|
| Without email | ~1 000 words / day |
| With email | ~10 000 words / day |

Resets automatically at midnight.

## Project Structure

```
chinese-translator-extension/
├── manifest.json      # Manifest V3 config
├── background.js      # API calls + usage tracking (service worker)
├── content.js         # Hover detection + tooltip
├── popup.html         # Settings page
└── popup.js           # Settings logic
```

## Tech Stack

- **Manifest V3** Chrome Extension API
- **MyMemory Translation API** – free, no key required
- Vanilla JS, no dependencies

## License

MIT
