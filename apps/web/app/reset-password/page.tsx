"use client";

import { useState, type ReactElement, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type {
  PasswordResetCompleteRequest,
} from "@sidewalk/types";
import { authMessages } from "../../lib/authCopy";
import { completePasswordReset } from "../../lib/authClient";

type State = "idle" | "loading" | "done" | "invalid" | "error";

export default function ResetPasswordPage(): ReactElement {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>(token ? "idle" : "invalid");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const els = e.currentTarget.elements;
    const password = (els.namedItem("password") as HTMLInputElement).value;
    const confirm = (els.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setErrorMsg(authMessages.resetPassword.complete.mismatchError);
      setState("error");
      return;
    }

    setState("loading");
    const body: PasswordResetCompleteRequest = { token, password };

    const result = await completePasswordReset(body);
    if (!result.ok) {
      if (
        result.error.code === "INVALID_TOKEN" ||
        result.error.code === "TOKEN_EXPIRED"
      ) {
        setState("invalid");
      } else {
        setErrorMsg(result.error.message ?? authMessages.genericError);
        setState("error");
      }
      return;
    }

    setState("done");
  }

  if (state === "done") {
    return (
      <main className="page-shell">
        <div className="auth-card">
          <p className="eyebrow">{authMessages.resetPassword.completeDone.eyebrow}</p>
          <h1 className="auth-heading">{authMessages.resetPassword.completeDone.heading}</h1>
          <p className="auth-body">{authMessages.resetPassword.completeDone.body}</p>
          <a href="/login" className="auth-button auth-button--inline">
            {authMessages.resetPassword.completeDone.cta}
          </a>
        </div>
      </main>
    );
  }

  if (state === "invalid") {
    return (
      <main className="page-shell">
        <div className="auth-card">
          <p className="eyebrow">{authMessages.resetPassword.invalidLink.eyebrow}</p>
          <h1 className="auth-heading">{authMessages.resetPassword.invalidLink.heading}</h1>
          <p className="auth-body">{authMessages.resetPassword.invalidLink.body}</p>
          <a href="/forgot-password" className="auth-button auth-button--inline">
            {authMessages.resetPassword.invalidLink.cta}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="auth-card">
        <p className="eyebrow">{authMessages.resetPassword.complete.eyebrow}</p>
        <h1 className="auth-heading">{authMessages.resetPassword.complete.heading}</h1>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="auth-label" htmlFor="password">
            {authMessages.resetPassword.complete.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="auth-input"
            disabled={state === "loading"}
          />

          <label className="auth-label" htmlFor="confirm">
            {authMessages.resetPassword.complete.confirmLabel}
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
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
              ? authMessages.resetPassword.complete.submitLoading
              : authMessages.resetPassword.complete.submitIdle}
          </button>
        </form>
      </div>
    </main>
  );
}
