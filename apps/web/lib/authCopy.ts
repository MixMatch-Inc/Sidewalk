/**
 * Keep auth-facing copy in one place so future locale files can mirror this shape.
 */
export const authMessages = {
  genericError: "Something went wrong. Please try again.",
  resetPassword: {
    request: {
      eyebrow: "Account recovery",
      heading: "Reset your password",
      body: "Enter your email and we'll send a reset link. We won't confirm whether the address is registered.",
      emailLabel: "Email address",
      submitIdle: "Send reset link",
      submitLoading: "Sending…",
    },
    requestDone: {
      eyebrow: "Request sent",
      heading: "Check your inbox",
      body: "If that address is registered, a reset link is on its way. Check your spam folder if it doesn't arrive within a few minutes.",
    },
    complete: {
      eyebrow: "Account recovery",
      heading: "Choose a new password",
      passwordLabel: "New password",
      confirmLabel: "Confirm password",
      submitIdle: "Set new password",
      submitLoading: "Saving…",
      mismatchError: "Passwords do not match.",
    },
    completeDone: {
      eyebrow: "All set",
      heading: "Password updated",
      body: "Your password has been changed. You can now sign in with your new credentials.",
      cta: "Go to sign in",
    },
    invalidLink: {
      eyebrow: "Link problem",
      heading: "This link is no longer valid",
      body: "Reset links expire after 1 hour and can only be used once. Request a new one to continue.",
      cta: "Request a new link",
    },
  },
} as const;
