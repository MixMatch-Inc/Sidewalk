# Flaky Network Login Checklist

Issue: #422

Use this checklist to validate login UX during unstable connectivity.

1. Offline at submit: show immediate connection error and keep form values.
2. Slow response (>3s): show non-blocking "still trying" status.
3. Timeout once, retry succeeds: preserve entered email/password and recover cleanly.
4. Intermittent failures (3 attempts): keep messaging consistent and avoid duplicate toasts.
5. Success after retries: clear transient error and continue to home.

Minimum acceptance: user always gets clear status and can retry without re-entering all data.
