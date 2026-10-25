# ScamLens – Product Specification

## 1. Overview
**ScamLens** is a free, privacy-first, single-file web application designed to help Australian Facebook Marketplace buyers and sellers spot scam warning signs before exchanging money or handing over goods.

ScamLens runs entirely client-side inside the user's browser with **no backend**, **no API calls**, **no external dependencies**, and **no build steps**.

---

## 2. Core Guardrails (Non-Negotiable)

1. **Never declare safety or certainty:**
   - Never say a deal is "safe", "verified", or "definitely a scam".
   - Use calibrated wording:
     - Level 0: *"No common warning signs found"* (with disclaimer: *"That doesn't mean it's safe. Keep checking before you pay."*)
     - Level 1: *"Some warning signs"*
     - Level 2: *"Several warning signs"*
     - Level 3: *"Strong warning signs"*
2. **Mandatory Scamwatch & Emergency Guidance:**
   - Always display links to official Australian resources: [Scamwatch](https://www.scamwatch.gov.au/), [ReportCyber](https://www.cyber.gov.au/report-and-recover/report), and [IDCARE](https://www.idcare.org/).
   - Always provide immediate guidance for users who have already sent money: *"Call your bank's fraud line now. Speed matters."*
3. **Strict Zero-Data-Leakage Privacy:**
   - Nothing the user pastes or inputs ever leaves their device.
   - No remote tracking, telemetry, third-party analytics, or external font/script CDNs.
   - Optional usage statistics are strictly local-only (`localStorage`), counting aggregate check events with zero personal data or message content.
4. **Accessibility & Tone:**
   - Plain Australian English (direct, reassuring, free of technical jargon).
   - Mobile-first layout with touch-friendly targets (minimum 48px hit areas).
   - WCAG 2.1 AA compliant: explicit form labels, visible `:focus-visible` focus rings, and minimum 4.5:1 color contrast.

---

## 3. Screens & User Flow

```
[Screen 1: Input]
   ├─ Mode Switch: "I'm buying" vs "I'm selling"
   ├─ Message Input: Textarea for conversation paste
   ├─ Price Check (Buying mode only): Listing price ($) & Usual price ($)
   ├─ Actions: "Check warning signs" & "Try an example"
   └─ Disclaimers & Privacy reassurance
         │
         ▼
[Screen 2: Warning Signs & Risk Assessment]
   ├─ Risk Banner: Visual meter (Level 0–3) + Risk summary
   ├─ Matched Flags: Clear warning title + Australian context explanation
   └─ Actions:
         ├─ "Get a safe reply" ────────► [Screen 3: Safe Transaction Assistant]
         │                                  ├─ Contextual suggested reply text
         │                                  ├─ "Copy message" button
         │                                  ├─ Safety checklist for buy/sell
         │                                  └─ Actions: "Check their reply", "Back"
         ├─ "I've already paid. What now?" ─► [Screen 4: Already Paid Help]
         │                                  ├─ Bank fraud call advice
         │                                  ├─ Scamwatch, ReportCyber & IDCARE contacts
         │                                  └─ Evidence preservation instructions
         └─ "Check another message" ───► Returns to Screen 1
```

---

## 4. Detection Rules & Risk Scoring

Detection is executed via weighted regular expressions evaluated against the pasted message:

| Rule ID | Applicable Modes | Weight | Category | Common Scam Indicator in Australia |
|---|---|---|---|---|
| `deposit` | Buy | 3 | Deposit before inspection | Demands deposit, holding fee, or reservation before physical inspection |
| `urgency` | Buy, Sell | 2 | Pressure to act fast | "Other buyers waiting", "hurry", "today only", "won't last" |
| `pay` | Buy, Sell | 2 | Risky / hard-to-reverse payment | PayID/Osko phishing, direct deposit, gift cards, crypto, Zelle, CashApp |
| `off` | Buy, Sell | 2 | Moving off Marketplace | Attempts to divert to WhatsApp, Telegram, email, or direct SMS |
| `conf` | Sell | 3 | Fake payment confirmation | "Payment sent/pending", "funds on hold", "upgrade your account to business/seller" |
| `over` | Sell | 3 | Overpayment scam | Buyer claims overpayment and asks seller to refund the difference or pay courier |
| `cour` | Sell | 2 | Courier / pickup agent scam | "My courier will pick it up", AusPost/DHL courier links, fake freight agents |
| `meet` | Buy | 2 | Inability to meet in person | "Out of town", "deployed", "oil rig", "interstate", "cannot inspect" |
| `link` | Buy, Sell | 2 | Suspicious links | Links sent in chat (`http`, `bit.ly`, fake banking/courier portals) |
| `info` | Buy, Sell | 3 | Sensitive credentials | Requests card numbers, OTP, verification codes, photo of driver license/passport |
| `price` | Buy (dynamic) | 2–3 | Too good to be true | Listing price >30% or >50% below fair market value |

### Risk Level Calculation:
- **Total Score = sum(matched rule weights)**
- **Level 0 (Score = 0):** No common warning signs found
- **Level 1 (Score 1–2):** Some warning signs (low-to-moderate risk)
- **Level 2 (Score 3–4):** Several warning signs (elevated risk)
- **Level 3 (Score >= 5):** Strong warning signs (critical risk)

---

## 5. Local Usage Counters
- Stored exclusively in the user's `localStorage` under `scamlens_stats`.
- Tracks:
  - `totalChecks`: Total number of analyses performed.
  - `buyChecks`: Number of checks in "I'm buying" mode.
  - `sellChecks`: Number of checks in "I'm selling" mode.
  - `flagsDetected`: Total count of individual flags triggered.
  - `lastChecked`: Timestamp of most recent check.
- Never stores or logs message text, prices, or user identities.

---

## 6. Out of Scope (Current Release)
- AI backend (LLM integrations).
- Screenshot OCR / image analysis.
- Domain reputation / URL sandbox checks.
- User accounts, logins, cloud sync.
- Payment processing or monetization.
