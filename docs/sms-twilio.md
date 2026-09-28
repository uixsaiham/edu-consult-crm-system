# SMS via Twilio — setup, approach and rollout

CRM location: **Communications › SMS Messages / SMS Campaigns / SMS Consent / SMS Setup**.

## What's built

| Area | Where | Notes |
|---|---|---|
| Service messages (status updates, document requests, appointment reminders) | SMS Messages → *Service message*; any contact's panel | Templates fill in name, course, university, stage, counsellor, branch |
| Marketing campaigns (courses, intakes, events, ambassadors) | SMS Campaigns | Audience by contact type, country, subject, intake. Only opted-in contacts are included; STOP text is required; a test to the internal group must go out before *Send now* unlocks |
| Consent register | SMS Consent | Service and marketing consent recorded separately, with source, evidence and a per-contact log. STOP replies received by the webhook are applied automatically |
| Delivery status and history | SMS Messages log; contact panel | Status from Twilio delivery receipts (webhook) or polled from the API until webhooks are live |
| Account review, sender setup, costs, rollout | SMS Setup | Reads the account through the server; never shows secrets |

Server routes (`src/app/api/sms/…`) are the only code that talks to Twilio:

- `POST /api/sms/send` — re-checks everything it can on its own: valid mobile, max 6 parts, no unfilled `{placeholders}`, STOP text on marketing, test-mode allowlist, daily test cap (50), numbers that replied STOP, and same-origin requests only.
- `GET /api/sms/status` — connection summary; `?review=1` reviews the account (local runs only).
- `GET /api/sms/messages?sids=` — latest delivery status.
- `POST /api/sms/opt-outs` — which numbers have replied STOP.
- `POST /api/sms/webhooks/status`, `POST /api/sms/webhooks/inbound` — Twilio webhooks; requests without a valid `X-Twilio-Signature` are rejected.

## Credentials

Set these **only** in the server environment: `.env.local` for local runs (git-ignored by the existing `.env*` rule), or the hosting provider's secret settings. Don't put values in code, chat, tickets or shared documents.

```
TWILIO_ACCOUNT_SID=AC…
TWILIO_API_KEY_SID=SK…              # a restricted API key just for the CRM (revocable)
TWILIO_API_KEY_SECRET=…
TWILIO_AUTH_TOKEN=…                  # only used to verify webhook signatures
TWILIO_SERVICE_MESSAGING_SID=MG…     # "BHE Uni – Service"
TWILIO_MARKETING_MESSAGING_SID=MG…   # "BHE Uni – Marketing"
SMS_MODE=test                        # off | test | live (live is locked in code until phase 2)
SMS_TEST_ALLOWLIST=+447…,+447…       # internal staff phones for phase 1
SMS_PUBLIC_BASE_URL=https://…        # public URL Twilio can reach, for webhooks
```

Restart the server after changing them, then press **Review Twilio account** on SMS Setup.

## Twilio console setup

1. **API key:** Account › API keys › Create, type *Restricted*, Messaging only.
2. **Messaging Service "BHE Uni – Service":** add alphanumeric sender `BHEUni`, plus a UK mobile number as fallback. Status callback: `{SMS_PUBLIC_BASE_URL}/api/sms/webhooks/status`.
3. **Messaging Service "BHE Uni – Marketing":** add a UK mobile number (two-way) and turn on Advanced Opt-Out (STOP / START / HELP). Status callback as above. Incoming messages: `{SMS_PUBLIC_BASE_URL}/api/sms/webhooks/inbound`.
4. **Geo permissions:** allow the United Kingdom, and Bangladesh only once its sender ID is registered.
5. **Billing:** add a low-balance alert, and cap auto-recharge.

Keeping two services means someone texting STOP to marketing never blocks their application updates.

## UK sender setup and costs

Prices are Twilio list prices checked September 2026; the account's own rates appear on SMS Setup after a review.

| | Sender | Price per part | Notes |
|---|---|---|---|
| UK service | Alphanumeric `BHEUni` | $0.056 | Free, shows the brand, no UK pre-registration (avoid protected brands). One-way: texts must tell people how to contact their counsellor |
| UK marketing | UK mobile number | $0.056 + ~$2.50/month | Two-way, so STOP works. PECR: prior opt-in, and every text says how to opt out |
| Bangladesh | Registered alphanumeric sender ID | $0.5962 | About 10× UK. Registration takes about 3 weeks; until then the main networks (Grameenphone, Robi, Teletalk) block the messages. WhatsApp is usually the better channel |
| Failed messages | — | $0.001 | Only on messages that end as Failed |

One part is 160 GSM characters (153 when split), or 70 (67) if the text contains emoji or non-Latin characters. The composer flags any character that forces the shorter limit.

**Example month:** 1,200 UK service texts plus 800 UK marketing texts, 1 part each, comes to about **$114 (£90)**, including the marketing number. Adding 500 texts to Bangladesh adds about **$298 (£235)**.

## Rollout

| Phase | When | Gate |
|---|---|---|
| 0. Account review and sender setup | 29 Sep – 3 Oct | Credentials in the server environment; the two Messaging Services created; start Bangladesh sender ID registration if needed |
| 1. Internal test (`SMS_MODE=test`, 3–5 staff numbers) | 6 – 17 Oct | Every template and one campaign tested; STOP and START round trip; signed delivery receipts arriving on staging; costs reconciled with Twilio |
| 2. Pilot: service messages for one branch | 20 Oct – 7 Nov | **Needs CRM sign-in and a database** (see below); then live mode is unlocked in code |
| 3. All branches, plus the first marketing campaign | 10 – 28 Nov | Opt-in checkbox on enquiry forms and the portal, with evidence captured |
| 4. Bangladesh | From December | Sender ID registered; SMS vs WhatsApp decided per message type |

## Known gaps before live sending

- **No sign-in.** The CRM has no authentication yet, so the API routes can't tell staff from anyone else. That's why `live` mode is refused in `src/app/api/sms/send/route.ts`, and why the account review only works locally. Add sign-in and check the session in every `/api/sms` route before unlocking.
- **No database.** Contacts, consent, message history and campaigns live in browser memory (like the rest of the CRM), and server-side opt-outs and delivery statuses in server memory. All of it must move to a database before phase 2, with consent records kept as an audit trail.
- **Scheduled campaigns** are saved but not sent automatically; that needs a background job (phase 3).
- **Recipients' timezone:** the send-hour warning uses the sender's clock, not the recipient's.
