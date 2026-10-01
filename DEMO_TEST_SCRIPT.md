# YourTube Lab — Evaluator Demo / Pre-Submission Test Script

Run this after local setup and again after deployment.

## 1. Base platform

- Open `/`.
- Confirm navigation, search and category chips work.
- Click **Demo sign in**.
- Open `/watch/v1` and confirm video playback starts.

## 2. Task 1 — Comments

- Post a normal English comment.
- Post a Hindi/Tamil/Russian comment.
- Change **Translate to** and confirm the displayed translation changes.
- Reply to a comment and confirm the reply is nested.
- Use `@username` in a comment.
- Like and dislike comments.
- Change sorting: newest, oldest, most liked, most relevant.
- Edit your own comment within 10 minutes.
- Delete your own comment and confirm the thread remains visible.
- Try a blocked word.
- Try `https://example.com` and confirm it is rejected.
- Paste the same comment twice and confirm the duplicate is rejected.
- Flood with repeated emojis/special characters and confirm moderation blocks it.
- After repeated posting attempts, confirm the CAPTCHA prompt appears.
- Report a comment with a predefined reason.
- Report the same comment again and confirm duplicate reporting is ignored.
- Open `/moderation` and mark a report reviewed.

## 3. Task 2 — Downloads

- From `/watch/v1`, click **Download**.
- Confirm the browser download starts for the demo MP4.
- Open `/downloads` and verify title, plan, timestamp, status, file size and quota remaining.
- Click Download for the same video again within 24 hours; confirm duplicate protection.
- Consume the daily quota and confirm the next download is blocked.
- Switch to a paid plan in `/subscriptions` and verify the quota changes.

## 4. Task 3 — Subscriptions

- Open `/subscriptions`.
- Compare monthly, quarterly and yearly views.
- Choose Bronze/Silver/Gold.
- Without backend/payment keys: verify clearly labeled demo payment activation.
- With Razorpay Test Mode configured: open Checkout and complete a test transaction.
- Confirm only a verified payment activates the plan.
- Confirm invoice/order/payment information appears in billing history.
- Confirm expiry is displayed.
- Confirm cancel returns the account to Free.

## 5. Task 4 — Security

- Open `/security`.
- Use **Log in from this device**.
- Confirm automatic theme follows the 05:00–12:00 IST rule unless a manual preference is saved.
- On the first untrusted device, enter the shown demo OTP or the OTP sent by the configured service.
- Confirm the device appears under Trusted devices.
- Run the login again and confirm trusted-device logic avoids another OTP prompt.
- Confirm browser, OS, device type, timestamp and location fields are displayed.

## 6. Task 5 — Player

From `/watch/v1`:

- Play/pause.
- Seek ±10 seconds.
- Shift + arrow seek ±30 seconds.
- Change speed: 0.5x, 1x, 1.25x, 1.5x, 2x.
- Change volume and mute.
- Toggle CC.
- Toggle PiP (browser support required).
- Toggle theater mode.
- Toggle fullscreen.
- Hover over timeline for preview.
- Let playback reach 90% and verify next-video countdown appears.
- Reload after partial playback and verify saved position resumes.

## 7. Task 6 — Calls

- Run the backend with `NEXT_PUBLIC_SOCKET_URL` pointing to it.
- Open `/calls` in two browser windows/devices.
- Create a room in one window and join from another.
- Allow camera/microphone permissions.
- Confirm local/remote video.
- Mute/unmute and toggle camera.
- Use screen sharing.
- Send in-call chat.
- Lock the room from the host window.
- Test participant removal.
- Refresh/reconnect one participant and verify the connection state updates.

## 8. Final submission checklist

- [ ] Frontend builds successfully.
- [ ] Backend starts successfully.
- [ ] MongoDB Atlas configured if persistence is required for the live demo.
- [ ] Razorpay Test Mode configured or demo mode clearly labeled.
- [ ] No secrets committed.
- [ ] GitHub repository is clean.
- [ ] Live URL works in an incognito window.
- [ ] All six task flows have screenshots/evidence.
- [ ] Internship report is complete.
- [ ] Daily work reports are logged.
- [ ] Final submission is made only after all checks pass.
