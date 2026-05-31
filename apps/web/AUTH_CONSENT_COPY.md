# Auth Consent and Privacy Copy

Canonical messaging for account creation, verification, and recovery across web and mobile.

---

## Signup

### Web (`apps/web`)

| Key | Copy |
|---|---|
| `signup.eyebrow` | Create your account |
| `signup.heading` | Join Sidewalk |
| `signup.body` | Sidewalk is a civic reporting tool. Your account is used to submit and track reports. |
| `signup.emailLabel` | Email address |
| `signup.passwordLabel` | Password |
| `signup.submitIdle` | Create account |
| `signup.submitLoading` | Creating… |
| `signup.consentNotice` | By creating an account you agree to our [Terms of Use](#) and [Privacy Policy](#). |
| `signup.privacyNote` | We use your email only for account verification and recovery. We do not sell your data. |

### Mobile (`apps/mobile`)

Mobile signup copy mirrors the web copy above. Differences are intentional:

| Key | Copy | Reason for difference |
|---|---|---|
| `signup.submitIdle` | Sign up | Shorter label fits small-screen buttons |
| `signup.consentNotice` | By signing up you agree to our Terms and Privacy Policy. | Link text shortened; full URLs in app settings |

---

## Email verification

| Key | Copy |
|---|---|
| `verify.eyebrow` | Almost there |
| `verify.heading` | Verify your email |
| `verify.body` | We sent a verification link to your email address. Click it to activate your account. |
| `verify.resendIdle` | Resend verification email |
| `verify.done` | Email verified. You can now sign in. |

---

## Privacy principles for the MVP

1. **Minimal collection.** Only email and hashed password are stored at signup.
2. **No tracking pixels or analytics at auth surfaces.** Auth pages do not load third-party scripts.
3. **Privacy-safe reset flow.** The password reset endpoint never confirms whether an email is registered (see `authCopy.ts → resetPassword.request.body`).
4. **Verification-only email.** The email address is used for verification and recovery only, not marketing.

---

## Copy drift policy

- Web and mobile copy must match in meaning. Wording may differ for layout reasons (see table above).
- All copy changes must update this file first, then `apps/web/lib/authCopy.ts` and `apps/mobile/src/lib/authMessaging.ts`.
- Do not add consent or privacy copy inline in components — keep it in the copy files so it can be reviewed as a unit.

---

## Follow-up implementation tasks

- [ ] Add `signup` section to `apps/web/lib/authCopy.ts` (see below).
- [ ] Add `signup` section to `apps/mobile/src/lib/authMessaging.ts`.
- [ ] Wire consent notice and privacy note into the signup form component when it is built.
- [ ] Replace `#` placeholder links with real Terms and Privacy Policy URLs before public launch.
