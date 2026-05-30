import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { AuthErrorCode, LoginResponse, SessionTokens } from "@sidewalk/types";

import {
  completePasswordReset,
  login,
  logout as apiLogout,
  memoryTokenStore,
  requestPasswordReset,
} from "./src/lib/authClient";
import { parseResetLink } from "./src/lib/deepLinks";
import {
  friendlyAuthMessage,
  privacySafeResetMessage,
} from "./src/lib/authMessaging";
import { isValidEmail, validatePassword, validatePasswordConfirm } from "./src/lib/validation";
import { sessionStorage } from "./src/lib/secureStorage";

// #378/#379 – sentinel used to distinguish network failures from auth failures
const NETWORK_ERROR_MSG = "Network error. Check your connection and try again.";

type Route =
  | { name: "login" }
  | { name: "forgotPassword" }
  | { name: "resetPassword"; token?: string }
  | { name: "verificationPending"; email?: string }
  | { name: "onboarding"; email: string }
  | { name: "home" };

type AuthState =
  | { status: "signedOut" }
  | { status: "unverified"; session: LoginResponse }
  | { status: "signedIn"; session: LoginResponse };

function apiUrlHint(): string | null {
  return process.env.EXPO_PUBLIC_API_URL ?? null;
}

function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled || props.busy}
      style={({ pressed }) => [
        styles.button,
        (props.disabled || props.busy) && styles.buttonDisabled,
        pressed && !(props.disabled || props.busy) && styles.buttonPressed,
      ]}
    >
      {props.busy ? (
        <ActivityIndicator color="#fffaf3" />
      ) : (
        <Text style={styles.buttonLabel}>{props.label}</Text>
      )}
    </Pressable>
  );
}

function LinkButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={props.onPress}>
      <Text style={styles.link}>{props.label}</Text>
    </Pressable>
  );
}

function ScreenShell(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  const urlHint = apiUrlHint();
  return (
    // #377 – KeyboardAvoidingView keeps form controls visible when the soft keyboard opens
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {/* #377 – ScrollView prevents content being clipped on small screens with keyboard open */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Sidewalk</Text>
            <Text
              style={styles.title}
              accessibilityRole="header"
            >
              {props.title}
            </Text>
            {props.subtitle ? <Text style={styles.subtitle}>{props.subtitle}</Text> : null}
            {!urlHint ? (
              <View style={styles.banner} accessibilityRole="alert">
                <Text style={styles.bannerTitle}>Missing API URL</Text>
                <Text style={styles.bannerBody}>Set EXPO_PUBLIC_API_URL to your API base URL.</Text>
              </View>
            ) : null}
            <View style={styles.content}>{props.children}</View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ErrorNotice(props: { message?: string | null }) {
  if (!props.message) return null;
  return (
    <View style={styles.noticeError} accessibilityLiveRegion="polite">
      <Text style={styles.noticeErrorText}>{props.message}</Text>
    </View>
  );
}

function SuccessNotice(props: { message?: string | null }) {
  if (!props.message) return null;
  return (
    <View style={styles.noticeSuccess} accessibilityLiveRegion="polite">
      <Text style={styles.noticeSuccessText}>{props.message}</Text>
    </View>
  );
}

function mapAuthError(code: AuthErrorCode): string {
  return friendlyAuthMessage(code);
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "login" });
  const [authState, setAuthState] = useState<AuthState>({ status: "signedOut" });
  const [bootstrapping, setBootstrapping] = useState(true);

  // #374 – restore session from secure storage on launch
  useEffect(() => {
    sessionStorage.getTokens().then((stored) => {
      // Stored tokens are opaque; we accept them as valid until the server rejects them.
      // A future improvement would be to call /auth/refresh here and fall back on 401.
      if (stored) {
        memoryTokenStore.set(stored);
        // We have tokens but no account details — stay on login so the user
        // can re-authenticate. A refresh endpoint could populate the session.
      }
      setBootstrapping(false);
    }).catch(() => setBootstrapping(false));
  }, []);

  useEffect(() => {
    function handleUrl(nextUrl: string | null | undefined) {
      if (!nextUrl) return;
      const reset = parseResetLink(nextUrl);
      if (reset) setRoute({ name: "resetPassword", token: reset.token });
    }

    Linking.getInitialURL().then(handleUrl).catch(() => {});
    const sub = Linking.addEventListener("url", (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  if (bootstrapping) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#7a3414" />
      </SafeAreaView>
    );
  }

  const session = authState.status === "signedOut" ? null : authState.session;
  const headerEmail = session?.account.email;

  // #375 – complete logout: server revocation + storage clear + nav reset
  async function handleLogout() {
    const tokens = memoryTokenStore.get();
    if (tokens) {
      await apiLogout(tokens.accessToken).catch(() => {});
    }
    memoryTokenStore.clear();
    await sessionStorage.clearTokens().catch(() => {});
    setAuthState({ status: "signedOut" });
    setRoute({ name: "login" });
  }

  if (route.name === "login") {
    return (
      <LoginScreen
        onLoginSuccess={async (sessionData, tokens) => {
          memoryTokenStore.set(tokens);
          await sessionStorage.setTokens(tokens).catch(() => {});
          if (sessionData.account.verified) {
            setAuthState({ status: "signedIn", session: sessionData });
            setRoute({ name: "home" });
          } else {
            setAuthState({ status: "unverified", session: sessionData });
            setRoute({ name: "verificationPending", email: sessionData.account.email });
          }
        }}
        onForgotPassword={() => setRoute({ name: "forgotPassword" })}
      />
    );
  }

  if (route.name === "forgotPassword") {
    return (
      <PasswordResetRequestScreen
        onDone={() => setRoute({ name: "login" })}
        onBack={() => setRoute({ name: "login" })}
      />
    );
  }

  if (route.name === "resetPassword") {
    return (
      <PasswordResetCompleteScreen
        initialToken={route.token}
        onBack={() => setRoute({ name: "login" })}
        onSuccess={() => setRoute({ name: "login" })}
      />
    );
  }

  if (route.name === "verificationPending") {
    return (
      <VerificationPendingScreen
        email={route.email ?? headerEmail}
        onBackToLogin={() => {
          handleLogout();
        }}
      />
    );
  }

  // #385: new verified accounts land on onboarding before the main shell
  if (route.name === "onboarding") {
    return (
      <OnboardingScreen
        email={route.email}
        onContinue={() => setRoute({ name: "home" })}
      />
    );
  }

  return (
    <HomeScreen
      email={headerEmail ?? "Signed in"}
      verified={session?.account.verified ?? false}
      onLogout={handleLogout}
    />
  );
}

function LoginScreen(props: {
  onLoginSuccess: (session: LoginResponse, tokens: SessionTokens) => void;
  onForgotPassword: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.trim().length > 0 && !busy;
  }, [busy, email, password]);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    const result = await login({ email: email.trim(), password });
    setBusy(false);

    if (!result.ok) {
      // #378 – VALIDATION_ERROR from the client layer means the fetch itself failed
      if (result.error.code === "VALIDATION_ERROR" && result.error.message.includes("not configured")) {
        setError(NETWORK_ERROR_MSG);
      } else {
        setError(mapAuthError(result.error.code));
      }
      return;
    }

    props.onLoginSuccess(result.data, {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
    });
  }

  return (
    <ScreenShell
      title="Sign in"
      subtitle="Use your email and password to access your account."
    >
      <ErrorNotice message={error} />
      {/* #379 – network offline notice */}
      {error === NETWORK_ERROR_MSG ? (
        <View style={styles.noticeError} accessibilityRole="alert">
          <Text style={styles.noticeErrorText}>
            No network connection. Check your connection and try again.
          </Text>
        </View>
      ) : null}
      <Text style={styles.label}>Email</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
        // #380 – accessibility
        accessibilityLabel="Email address"
        accessibilityHint="Enter the email address for your account"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={canSubmit ? handleSubmit : undefined}
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
        // #380 – accessibility
        accessibilityLabel="Password"
        accessibilityHint="Enter your account password"
      />

      <PrimaryButton label="Sign in" onPress={handleSubmit} disabled={!canSubmit} busy={busy} />
      <View style={styles.row}>
        <LinkButton label="Forgot password?" onPress={props.onForgotPassword} />
      </View>
    </ScreenShell>
  );
}

function PasswordResetRequestScreen(props: { onBack: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && !busy;
  }, [busy, email]);

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await requestPasswordReset({ email: email.trim() });
    setBusy(false);

    if (!result.ok) {
      if (result.error.code === "VALIDATION_ERROR") {
        setError("Enter a valid email address.");
        return;
      }
      setError(mapAuthError(result.error.code));
      setSuccess(privacySafeResetMessage());
      return;
    }

    setSuccess(privacySafeResetMessage());
  }

  return (
    <ScreenShell
      title="Reset password"
      subtitle="We’ll email you a link to reset your password."
    >
      <ErrorNotice message={error} />
      <SuccessNotice message={success} />

      <Text style={styles.label}>Email</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
      />

      <PrimaryButton
        label="Send reset link"
        onPress={handleSubmit}
        disabled={!canSubmit}
        busy={busy}
      />

      <View style={styles.rowBetween}>
        <LinkButton label="Back to sign in" onPress={props.onBack} />
        {success ? <LinkButton label="Done" onPress={props.onDone} /> : null}
      </View>
    </ScreenShell>
  );
}

function PasswordResetCompleteScreen(props: {
  initialToken?: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [token, setToken] = useState(props.initialToken ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const pwdOk = validatePassword(password).ok;
    const confirmOk = validatePasswordConfirm(password, confirm).ok;
    return token.trim().length > 0 && pwdOk && confirmOk && !busy;
  }, [busy, confirm, password, token]);

  async function handleSubmit() {
    const pwdResult = validatePassword(password);
    if (!pwdResult.ok) {
      setError(pwdResult.message ?? "Please check your password.");
      return;
    }
    const confirmResult = validatePasswordConfirm(password, confirm);
    if (!confirmResult.ok) {
      setError(confirmResult.message ?? "Passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await completePasswordReset({ token: token.trim(), password });
    setBusy(false);

    if (!result.ok) {
      setError(mapAuthError(result.error.code));
      return;
    }

    setSuccess("Password updated. You can sign in with your new password.");
  }

  return (
    <ScreenShell
      title="Choose a new password"
      subtitle="Use the token from your reset link to finish updating your password."
    >
      <ErrorNotice message={error} />
      <SuccessNotice message={success} />

      <Text style={styles.label}>Reset token</Text>
      <TextInput
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
        placeholder="Paste token from link"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
      />

      <Text style={styles.label}>New password</Text>
      <TextInput
        secureTextEntry
        autoCapitalize="none"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
      />

      <Text style={styles.label}>Confirm password</Text>
      <TextInput
        secureTextEntry
        autoCapitalize="none"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter new password"
        placeholderTextColor="#8a7b6b"
        style={styles.input}
      />

      <PrimaryButton
        label={success ? "Back to sign in" : "Update password"}
        onPress={success ? props.onSuccess : handleSubmit}
        disabled={success ? false : !canSubmit}
        busy={busy}
      />

      <View style={styles.row}>
        <LinkButton label="Back" onPress={props.onBack} />
      </View>
    </ScreenShell>
  );
}

function VerificationPendingScreen(props: { email?: string; onBackToLogin: () => void }) {
  const message = props.email
    ? `We sent a verification email to ${props.email}. Please verify your account to continue.`
    : "Check your inbox for the verification email. Please verify your account to continue.";

  return (
    <ScreenShell
      title="Verify your email"
      subtitle="You’re almost done. Complete verification to activate your account."
    >
      <View style={styles.noticeInfo}>
        <Text style={styles.noticeInfoText}>{message}</Text>
      </View>

      <Text style={styles.body}>
        Resend and “open inbox” actions will be added soon. For now, return after verifying.
      </Text>

      <PrimaryButton label="Back to sign in" onPress={props.onBackToLogin} />
    </ScreenShell>
  );
}

function HomeScreen(props: { email: string; verified: boolean; onLogout: () => void }) {
  return (
    <ScreenShell title="You’re signed in" subtitle={props.verified ? "Verified account" : "Unverified account"}>
      <View style={styles.noticeSuccess}>
        <Text style={styles.noticeSuccessText}>{props.email}</Text>
      </View>
      <PrimaryButton label="Sign out" onPress={props.onLogout} />
    </ScreenShell>
  );
}

// #385 – first landing screen for newly created accounts.
// This is a stub; onboarding steps (profile setup, tour, etc.) are added here.
function OnboardingScreen(props: { email: string; onContinue: () => void }) {
  return (
    <ScreenShell
      title="Welcome to Sidewalk"
      subtitle="You’re all set. Let’s get you oriented before you dive in."
    >
      <View style={styles.noticeInfo}>
        <Text style={styles.noticeInfoText}>
          Signed in as {props.email}
        </Text>
      </View>
      <Text style={styles.body}>
        Onboarding steps will appear here. For now, continue to the app.
      </Text>
      <PrimaryButton label="Continue" onPress={props.onContinue} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: "#f4efe4",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: "#fffaf3",
    padding: 24,
    shadowColor: "#7a3414",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  eyebrow: {
    marginBottom: 8,
    color: "#7a3414",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#22170e",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: "#574a3d",
  },
  content: {
    marginTop: 18,
    gap: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#22170e",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e0d3c3",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    color: "#22170e",
  },
  button: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#7a3414",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    color: "#fffaf3",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: "#7a3414",
    fontWeight: "700",
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noticeError: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#ffe8e8",
    borderWidth: 1,
    borderColor: "#ffb7b7",
  },
  noticeErrorText: {
    color: "#7a1414",
    fontWeight: "600",
    lineHeight: 20,
  },
  noticeSuccess: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#e8fff1",
    borderWidth: 1,
    borderColor: "#98e8b8",
  },
  noticeSuccessText: {
    color: "#145a2c",
    fontWeight: "600",
    lineHeight: 20,
  },
  noticeInfo: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#f1f0ff",
    borderWidth: 1,
    borderColor: "#c7c3ff",
  },
  noticeInfoText: {
    color: "#2a287a",
    fontWeight: "600",
    lineHeight: 20,
  },
  banner: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#fff3d9",
    borderWidth: 1,
    borderColor: "#ffd99a",
  },
  bannerTitle: {
    fontWeight: "800",
    color: "#7a3414",
    marginBottom: 4,
  },
  bannerBody: {
    color: "#574a3d",
    lineHeight: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#574a3d",
  },
});
