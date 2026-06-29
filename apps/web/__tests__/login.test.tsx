import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/apiClient")>();
  return {
    ...actual,
    apiClient: {
      login: vi.fn(),
      register: vi.fn(),
      getCurrentUser: vi.fn(),
    },
  };
});

import { apiClient } from "../lib/apiClient";
import LoginPage from "../app/page";
import { AuthProvider } from "../lib/authContext";

const TOKEN_KEY = "sidewalk.authToken";

const mockUser = {
  id: "u-1",
  email: "jane@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Unauthenticated state
// ---------------------------------------------------------------------------

describe("LoginPage — unauthenticated", () => {
  it("renders the login form", async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows a validation error for an invalid email", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("shows a form-level error when the API rejects credentials", async () => {
    const { ApiError } = await import("../lib/apiClient");
    vi.mocked(apiClient.login).mockRejectedValue(
      new ApiError("UNAUTHORIZED", "Invalid email or password."),
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByRole("heading", { name: "Log in" }));

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email or password/i);
  });
});

// ---------------------------------------------------------------------------
// Authenticated state
// ---------------------------------------------------------------------------

describe("LoginPage — authenticated", () => {
  it("shows the welcome-back view when a user is already logged in", async () => {
    vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);
    localStorage.setItem(TOKEN_KEY, "valid-token");

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    });

    expect(screen.getByText(`Logged in as ${mockUser.email}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("returns to the login form after logout", async () => {
    vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser);
    localStorage.setItem(TOKEN_KEY, "valid-token");

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );

    await waitFor(() => screen.getByRole("button", { name: "Log out" }));

    await user.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
