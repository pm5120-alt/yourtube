# START HERE — YourTube Lab Internship Build

## What this package is

This package starts from the supplied training codebase and keeps the same overall full-stack direction: Next.js/React frontend, Express backend, MongoDB/Mongoose models/routes, plus the training-era video upload and user features on the server. The internship modules are added into the same application surface rather than delivered as six unrelated repositories.

## The six review paths

- `/` → YouTube-style feed / training foundation
- `/watch/v1` → custom video player + comments + controlled download
- `/subscriptions` → Free/Bronze/Silver/Gold plans + test-mode billing record
- `/downloads` → download quota and audit dashboard
- `/security` → theme logic + OTP/trusted-device demo + login history
- `/moderation` → comment reports and moderation log
- `/calls` → WebRTC room UI; real signaling activates when `NEXT_PUBLIC_SOCKET_URL` points to the Express server
- `/upload` → refreshed upload studio connected conceptually to the original training upload flow

## Before GitHub

1. `cd yourtube && npm install && npm run dev`
2. Open `http://localhost:3000`
3. Click `Demo sign in`.
4. Test each route from the sidebar.
5. For real group calls, run the `server` and set `NEXT_PUBLIC_SOCKET_URL` in `.env.local`.

## Before the final internship submission

Add your own screenshots and report evidence after you test each feature. Keep a daily development log because the internship instructions require daily reporting.

The current UI intentionally uses a small original visual layer — rounded cards, cyan/violet lab accents, status chips and a review-focused navigation — while keeping the recognizable YouTube-style learning structure.
