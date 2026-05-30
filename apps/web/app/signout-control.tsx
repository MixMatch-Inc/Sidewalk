"use client";

import { useState, type ReactElement } from "react";
import { logout, getAccessToken, getRefreshToken } from "../lib/authClient";

export default function SignOutControl(): ReactElement | null {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const hasSession = Boolean(getAccessToken() || getRefreshToken());
  if (!hasSession) return null;

  async function onSignOut(): Promise<void> {
    setBusy(true);
    setMessage("");
    const result = await logout();
    if (!result.ok) {
      setMessage(result.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    window.location.reload();
  }

  return (
    <div className="signout-wrap">
      <button
        type="button"
        className="auth-button auth-button--ghost"
        disabled={busy}
        onClick={onSignOut}
      >
        {busy ? "Signing out..." : "Sign out"}
      </button>
      {message ? (
        <p role="alert" className="auth-error signout-error">
          {message}
        </p>
      ) : null}
    </div>
  );
}
