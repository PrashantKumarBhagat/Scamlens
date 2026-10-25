# CLAUDE.md – ScamLens Developer Guide

## Project Summary
**ScamLens** is a single-file zero-dependency web app (`index.html`) helping Australians detect common Facebook Marketplace scams before exchanging money.

---

## Non-Negotiable Guardrails
1. **Never use definitive safety terms:** Do not output phrases like "Safe", "100% scam", or "Verified genuine". Always use "warning signs found" or "no common warning signs found".
2. **Mandatory Scamwatch / Emergency advice:** Every screen or primary flow must retain access to Scamwatch, ReportCyber, IDCARE, and the urgent reminder: *"Already paid? Call your bank immediately."*
3. **100% Client-Side Privacy:** No external network requests, no analytics SDKs, no font CDNs. All text processing stays strictly on-device.
4. **Single-File Delivery:** The core application must remain a single, fully-contained `index.html` file (HTML + CSS + JS inline).
5. **Mobile-First & Accessible:** Australian English, WCAG 2.1 AA compliant (minimum 4.5:1 text contrast, visible focus rings, touch targets >= 48px).

---

## Directory Structure
```
.
├── index.html           # Complete application (HTML, CSS, JS)
├── SPEC.md              # Functional specification & rule definitions
├── CLAUDE.md            # Architecture & developer reference
└── tests/
    ├── messages.json    # 30+ test cases (scam vs genuine, buy vs sell)
    └── run.js           # Zero-dependency Node.js test runner
```

---

## Development & Test Commands
Run the validation test suite (zero external npm dependencies required):
```bash
node tests/run.js
```

To test locally in browser:
Open `index.html` directly in any modern browser or run a lightweight local static server:
```bash
python -m http.server 8000
# or
npx serve .
```

---

## Rule Tuning Guidelines
- Rules are defined in the `RULES` array in `index.html`.
- Each rule consists of:
  - `id`: unique string identifier
  - `m`: array of modes (`['buy']`, `['sell']`, or `['buy', 'sell']`)
  - `w`: integer weight (typically 2 for moderate risk indicators, 3 for high-severity red flags)
  - `re`: Regular expression matching Australian scam patterns
  - `t`: Flag title (plain Australian English)
  - `y`: Explanation string explaining why it is a warning sign
- Avoid false positives on common Australian colloquialisms (e.g., standard polite requests to pick up after work, cash on pickup, asking if an item is available).
- The test suite in `tests/messages.json` must maintain >= 90% accuracy before any change is merged.
