"use client";

import { useState, type ReactElement, type FormEvent } from "react";
import type {
  PasswordResetRequestRequest,
} from "@sidewalk/types";
import { authMessages } from "../../lib/authCopy";
import { requestPasswordReset } from "../../lib/authClient";

type State = "idle" | "loading" | "done" | "error";

export default function ForgotPasswordPage(): ReactElement {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const body: PasswordResetRequestRequest = { email };

    const result = await requestPasswordReset(body);
    if (!result.ok) {
      setErrorMsg(result.error.message ?? authMessages.genericError);
      setState("error");
      return;
    }

    setState("done");
  }

  if (state === "done") {
    return (
      <main className="page-shell">
        <div className="auth-card">
          <p className="eyebrow">{authMessages.resetPassword.requestDone.eyebrow}</p>
          <h1 className="auth-heading">{authMessages.resetPassword.requestDone.heading}</h1>
          <p className="auth-body">{authMessages.resetPassword.requestDone.body}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="auth-card">
        <p className="eyebrow">{authMessages.resetPassword.request.eyebrow}</p>
        <h1 className="auth-heading">{authMessages.resetPassword.request.heading}</h1>
        <p className="auth-body">{authMessages.resetPassword.request.body}</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-label" htmlFor="email">
            {authMessages.resetPassword.request.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="auth-input"
            disabled={state === "loading"}
          />

          {state === "error" && (
            <p className="auth-error" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={state === "loading"}
          >
            {state === "loading"
              ? authMessages.resetPassword.request.submitLoading
              : authMessages.resetPassword.request.submitIdle}
          </button>
        </form>
      </div>
    </main>
  );
}
