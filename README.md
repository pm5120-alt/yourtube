# YourTube Lab — Internship Submission Build

YourTube Lab is a YouTube-style learning platform extended with the six assigned internship modules. The project keeps the training direction (Next.js/React frontend + Express backend + MongoDB/Mongoose) and adds a compact original visual layer rather than copying YouTube's branding.

## What is included

1. **Advanced multilingual comments** — language selection, translation preview, replies, @mentions, likes/dislikes, sorting, moderation checks, CAPTCHA after repeated posting, predefined reports, moderation queue, soft deletion, edit/delete time window, comment history, duplicate-report protection and stale-edit detection.
2. **Controlled downloads** — Free/Bronze/Silver/Gold quota rules, duplicate-window protection, pre-download authorization, audit fields, Downloads dashboard and daily usage view.
3. **Subscriptions** — Free/Bronze/Silver/Gold, monthly/quarterly/yearly pricing, status/expiry dashboard, Razorpay Test Mode order creation + signature verification when server keys are configured, demo payment fallback, billing records and optional receipt email through Resend.
4. **Account security** — IST time-based theme defaults, persistent manual theme preference, login audit records, browser/OS/device detection, OTP challenge/verification, trusted-device records and a security dashboard.
5. **Custom HTML5 player** — custom controls, volume, mute, 10s/30s seeking, speed selection, buffering indicator, remaining time, captions toggle, PiP, theater/fullscreen, hover timeline preview, keyboard shortcuts, watch-position persistence and autoplay countdown.
6. **Real-time video calls** — WebRTC peer media with the Express SSE signaling service, room IDs, 1-to-1/group rooms, chat, camera/mic controls, screen sharing, participant states, room locking and host moderation hooks.

## Run locally

### 1) Frontend

```bash
cd yourtube
npm install
npm run dev
```

Open `http://localhost:3000` and choose **Demo sign in**.

### 2) Backend / signaling

Open another terminal:

```bash
cd server
npm install
npm start
```

Copy `server/.env.example` to `server/.env` and optionally set `DB_URL` for MongoDB persistence.

Copy `yourtube/.env.example` to `yourtube/.env.local`.

For real signaling, keep:

```text
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

For task APIs, use:

```text
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Razorpay Test Mode

The application supports two modes:

- **Demo mode**: works without payment credentials so the reviewer can walk through the complete membership UI locally.
- **Razorpay Test Mode**: add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `server/.env`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` is returned by the order endpoint. The browser opens Razorpay Checkout, while the server verifies the returned payment signature before activating the subscription.

Never put the Razorpay secret into the frontend or commit it to GitHub.

## Optional receipt email

Set `RESEND_API_KEY`, `MAIL_FROM`, and `SUPPORT_EMAIL` in `server/.env` to send the purchase confirmation email after successful payment verification. Without email credentials, the verified transaction is still stored and the dashboard tells the reviewer that email delivery is not configured.

## Review paths

```text
/                       YouTube-style home feed
/watch/v1               Custom player + comments + download flow
/subscriptions          Plans + payment flow + billing history
/downloads              Download quota + audit history
/security               Login security + OTP + trusted devices
/moderation             Report queue + moderation log
/calls                  WebRTC room + chat + host controls
/upload                 Training-era upload studio
```

## Deployment architecture

Recommended setup:

- **Frontend:** Vercel (Next.js)
- **Backend:** Render/Railway/Fly.io/another Node host
- **Database:** MongoDB Atlas
- **Payment:** Razorpay Test Mode for internship evaluation

Set the production frontend's `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_SOCKET_URL` to the deployed Express server. Set backend secrets only in the backend host's environment settings.

## Submission safety

The repository is intended to be pushed without `.env` files, secrets, `node_modules`, or runtime upload contents. Run the supplied `DEMO_TEST_SCRIPT.md` before the one-time internship submission and capture screenshots for the report.

## Notes on original training alignment

The project preserves the YouTube-style navigation, video feed, watch page, upload concept and existing Express/Mongoose training direction. The internship work is layered into that single application rather than split into unrelated mini-projects.

## Hydration stability patch

The v3 candidate keeps browser-only state (saved plan, security metadata and download records) out of the initial server render. This prevents Next.js hydration mismatches when localStorage contains a plan different from the default Free plan.
