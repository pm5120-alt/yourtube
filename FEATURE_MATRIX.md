# Feature Matrix — YourTube Lab Internship Build

| Internship task | Implemented in app | Backend support | Zero-config demo fallback |
|---|---|---|---|
| 1. Multilingual comments | ✅ | ✅ Task comment/report/history models + APIs | ✅ localStorage |
| 2. Controlled downloads | ✅ | ✅ authorization + audit API | ✅ localStorage |
| 3. Subscriptions | ✅ | ✅ order creation + payment verification API | ✅ demo payment mode |
| 4. Login security | ✅ | ✅ login log + OTP challenge/verify APIs | ✅ demo OTP |
| 5. Custom player | ✅ | Progress state stored client-side for demo | ✅ |
| 6. Video calling | ✅ | ✅ SSE signaling + WebRTC | ✅ local demo room UI |

## Task 1 checklist

- multilingual comment entry: ✅
- translation control: ✅ built-in phrasebook fallback + configurable API path in backend design
- username/avatar/location/timestamp: ✅
- edited status: ✅
- like/dislike: ✅
- replies: ✅ nested replies
- @mentions: ✅ input-supported
- edit/delete time limit: ✅ 10 minutes
- newest/oldest/most liked/relevant: ✅
- abusive words: ✅
- spam/repeated characters: ✅
- duplicate comments: ✅
- malicious links: ✅
- posting flood/CAPTCHA: ✅
- predefined reporting: ✅
- admin review queue: ✅
- comment history: ✅
- duplicate reports: ✅
- deleted parent with replies: ✅ soft-delete keeps replies
- simultaneous edit handling: ✅ version check in API/local state

## Task 2 checklist

- plan-based quotas: ✅
- active subscription check: ✅ when Mongo-backed task API is enabled
- daily quota: ✅
- duplicate-download window: ✅ 24 hours
- audit data: ✅ IP, device, browser, plan, timestamp, file size, status, quota remaining
- expiry restriction: ✅ server derives active plan from paid, non-expired subscription records
- daily reset: ✅ date-based usage calculation
- interrupted/failed states: ✅ audit schema supports started/completed/failed

## Task 3 checklist

- Free/Bronze/Silver/Gold: ✅
- monthly/quarterly/yearly: ✅
- dashboard + billing history: ✅
- upgrade/downgrade/renew/cancel: ✅ plan selection + cancel flow
- Razorpay Test Mode: ✅ order + HMAC signature verification when keys are configured
- duplicate/failed/cancelled payment handling: ✅ checkout failure leaves pending order; verification is required before activation
- transaction metadata: ✅ order, payment, invoice, amount, currency, dates, status
- expiry fallback to Free: ✅ client-side expiry normalization; backend subscription records remain auditable
- confirmation email: ✅ optional Resend integration

## Task 4 checklist

- IST theme rule: ✅
- persistent manual theme override: ✅
- browser/OS/device detection: ✅
- public IP server capture: ✅ backend route stores request IP
- city/state/country fields: ✅ model + UI fields (demo region by default)
- new-device OTP: ✅
- trusted device duration: ✅ 30 days in demo UI
- OTP attempt limits: ✅
- login/security history: ✅

## Task 5 checklist

- custom HTML5 controls: ✅
- play/pause: ✅
- volume/mute: ✅
- speed 0.5–2x: ✅
- ±10s seeking: ✅
- Shift + arrows ±30s: ✅
- theater/fullscreen/PiP: ✅ where supported by browser
- subtitles toggle: ✅ demo caption layer
- current/remaining time: ✅
- buffering indicator: ✅
- last position resume: ✅
- periodic progress save: ✅
- completed threshold: ✅ 90%
- autoplay countdown: ✅
- hover preview: ✅ timeline time preview
- controls auto-hide: ✅

## Task 6 checklist

- one-to-one + group rooms: ✅
- unique room ID: ✅
- camera/mic: ✅
- screen sharing: ✅
- participant list/status: ✅
- chat: ✅
- small file sharing: ✅
- host lock/remove/mute: ✅
- reconnection state: ✅ SSE reconnect + peer connection state
- permission denial: ✅ UI fallback
- participant limit: ✅ 8 on signaling server
- meeting authentication: ⚠️ demo-friendly room model; production auth should be layered onto the signaling endpoints before real-world use
- end-to-end encryption: ⚠️ WebRTC media is peer-encrypted in supported browser stacks, but the signaling/auth layer is not presented as a certified E2EE product
