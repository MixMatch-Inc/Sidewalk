/**
 * Tests for AuthProvider and useAuth.
 *
 * Covers three session states:
 *   1. No stored token  → unauthenticated after mount
 *   2. Valid stored token → getCurrentUser succeeds → authenticated
 *   3. Stale stored token → getCurrentUser fails → token cleared, unauthenticated
 *
 * And the two user-initiated transitions:
 *   4. login()  → token stored, user set
 *   5. logout() → token removed, user cleared
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/apiClient", () => ({
  apiClient: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { apiClient } from "../lib/apiClient";
import { AuthProvider, useAuth } from "../lib/authContext";

const TOKEN_KEY = "sidewalk.authToken";

const mockUser = {
  id: "u-1",
  email: "user@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function SessionDisplay() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div data-testid="loading">Loading...</div>;
  if (user) return <div data-testid="authenticated">Logged in as {user.email}</div>;
  return <div data-testid="unauthenticated">Not logged in</div>;
}

function LoginButton() {
  const { login } = useAuth();
  return (
    <button onClick={() => login("user@example.com", "password123")}>
      Log in
    </button>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={logout}>Log out</button>;
}

function AuthControls() {
  const { user, login, logout } = useAuth();
  if (user)
    return (
      <>
        <span data-testid="user-email">{user.email}</span>
        <button onClick={logout}>Log out</button>
      </>
    );
  return (
    <button onClick={() => login("user@example.com", "password123")}>
      Log in
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 1. No stored token
// ---------------------------------------------------------------------------

describe("AuthProvider — no stored token", () => {
  it("resolves to unauthenticated and never calls getCurrentUser", async () => {
    render(
      <AuthProvider>
        <SessionDisplay />
      </AuthProvider>,
    );

    // jsdom resolves effects synchronously when there is no async work,
    // so the loading flash may not persist to a paint — assert the settled state.
    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });

    expect(apiClient.getCurrentUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. Valid stored token
// ---------------------------------------------------------------------------

describe("AuthProvider — valid stored token", () => {
  it("hydrates from localStorage and sets authenticated state", async () => {
    vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);
    localStorage.setItem(TOKEN_KEY, "valid-token");

    render(
      <AuthProvider>
        <SessionDisplay />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toBeInTheDocument();
    });

    expect(screen.getByText("Logged in as user@example.com")).toBeInTheDocument();
    expect(apiClient.getCurrentUser).toHaveBeenCalledWith("valid-token");
  });
});

// ---------------------------------------------------------------------------
// 3. Stale stored token
// ---------------------------------------------------------------------------

describe("AuthProvider — stale stored token", () => {
  it("clears the token and stays unauthenticated when getCurrentUser fails", async () => {
    vi.mocked(apiClient.getCurrentUser).mockRejectedValue(new Error("401 Unauthorized"));
    localStorage.setItem(TOKEN_KEY, "stale-token");

    render(
      <AuthProvider>
        <SessionDisplay />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. login() transition
// ---------------------------------------------------------------------------

describe("AuthProvider — login()", () => {
  it("sets user, stores token, and transitions to authenticated state", async () => {
    vi.mocked(apiClient.login).mockResolvedValue({ token: "new-token", user: mockUser });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SessionDisplay />
        <LoginButton />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByTestId("unauthenticated"));

    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new-token");
    expect(apiClient.login).toHaveBeenCalledWith("user@example.com", "password123");
  });
});

// ---------------------------------------------------------------------------
// 5. logout() transition
// ---------------------------------------------------------------------------

describe("AuthProvider — logout()", () => {
  it("clears user and token and transitions to unauthenticated state", async () => {
    vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);
    localStorage.setItem(TOKEN_KEY, "active-token");

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <SessionDisplay />
        <LogoutButton />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(screen.getByTestId("unauthenticated")).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Full round-trip: login → logout
// ---------------------------------------------------------------------------

describe("AuthProvider — login then logout round-trip", () => {
  it("correctly cycles through authenticated and back to unauthenticated", async () => {
    vi.mocked(apiClient.login).mockResolvedValue({ token: "session-token", user: mockUser });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthControls />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByRole("button", { name: "Log in" }));

    await user.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() => screen.getByTestId("user-email"));
    expect(screen.getByTestId("user-email")).toHaveTextContent("user@example.com");

    await user.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => screen.getByRole("button", { name: "Log in" }));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
