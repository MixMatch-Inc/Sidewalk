import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiFetch } from '../lib/api';
import { trackEvent } from '../lib/analytics';
import { useSession } from '../providers/session-provider';

type RequestOtpResponse = {
  success: boolean;
  expiresInSeconds: number;
};

type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  expiresIn: string;
};

export default function LoginScreen() {
  const roreturnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { uter = useRouter();
  const { deviceId, signIn } = useSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [district, setDistrict] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'AGENCY_ADMIN'>('CITIZEN');
  const [otpRequested, setOtpRequested] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const canSubmit = Boolean(deviceId);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setRequestError('Email is required.');
      return;
    }

    setIsRequesting(true);
    setRequestError(null);
    setVerifyError(null);
trackEvent('auth.otp_requested', {
        method: 'otp',
      });

      
    try {
      const payload = await apiFetch<RequestOtpResponse>('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      setOtpRequested(true);
      setExpiresInSeconds(payload.expiresInSeconds);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to request OTP.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!deviceId) {
      setVerifyError('Device session is still initializing. Try again in a moment.');
      return;
    }trackEvent('auth.verify_started', {
        method: 'otp',
      });

      const payload = await apiFetch<VerifyOtpResponse>('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          district: district.trim() || undefined,
          role,
          deviceId,
          clientType: 'mobile',
        }),
      });

      await signIn({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
        email: email.trim(),
        role,
      });

      trackEvent('auth.verify_success', {
        method: 'otp',
      });

      router.replace(returnTo ?? '/(app)/(tabs)');
    } catch (error) {
      trackEvent('auth.verify_failure', {
        method: 'otp',
      });xpiresAt: payload.refreshTokenExpiresAt,
        email: email.trim(),
        role,
      });

      router.replace('/(app)/(tabs)');
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : 'Unable to verify OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Sidewalk Mobile</Text>
        <Text style={styles.title}>Sign in with OTP.</Text>
        <Text style={styles.copy}>
          Request a one-time code, verify it on this device, and continue into the
          protected reporting workspace.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="citizen@example.com"
            placeholderTextColor="#7b8c84"
            style={styles.input}
            value={email}
          />

          <Pressable
            disabled={isRequesting || !canSubmit}
            onPress={handleRequestOtp}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isRequesting || !canSubmit) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isRequesting ? 'Sending…' : 'Request OTP'}
            </Text>
          </Pressable>

          {expiresInSeconds ? (
            <Text style={styles.successText}>
              OTP issued. It expires in about {Math.ceil(expiresInSeconds / 60)} minutes.
            </Text>
          ) : null}
          {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}
          {!canSubmit ? (
            <Text style={styles.helperText}>Preparing this device for sign-in…</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verify Code</Text>
          <Text style={styles.helperText}>
            Enter the 6-digit OTP sent to your email to restore or create your session.
          </Text>

          <Text style={styles.label}>OTP Code</Text>
          <TextInput
            inputMode="numeric"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={setCode}
            placeholder="123456"
            placeholderTextColor="#7b8c84"
            style={styles.input}
            value={code}
          />

          {__DEV__ ? (
            <>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                {(['CITIZEN', 'AGENCY_ADMIN'] as const).map((roleOption) => (
                  <Pressable
                    key={roleOption}
                    onPress={() => setRole(roleOption)}
                    style={[
                      styles.roleChip,
                      role === roleOption ? styles.roleChipSelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === roleOption ? styles.roleChipTextSelected : null,
                      ]}
                    >
                      {roleOption === 'CITIZEN' ? 'Citizen' : 'Agency admin'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>District (optional)</Text>
          <TextInput
            onChangeText={setDistrict}
            placeholder="Ikeja"
            placeholderTextColor="#7b8c84"
            style={styles.input}
            value={district}
          />

          <Pressable
            disabled={isVerifying || !otpRequested || !canSubmit}
            onPress={handleVerifyOtp}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || isVerifying || !otpRequested || !canSubmit) && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isVerifying ? 'Verifying…' : 'Verify OTP'}
            </Text>
          </Pressable>

          {!otpRequested ? (
            <Text style={styles.helperText}>Request a code before verifying.</Text>
          ) : null}
          {verifyError ? <Text style={styles.errorText}>{verifyError}</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#f4efe6',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    fontWeight: '700',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#112219',
  },
  copy: {
    color: '#405149',
    lineHeight: 22,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fffaf2',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#112219',
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
    color: '#1e2c26',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7d0c2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#112219',
  },
  primaryButton: {
    marginTop: 6,
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#1f4d3f',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: '#f8fff8',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  helperText: {
    color: '#51615a',
    lineHeight: 20,
  },
  successText: {
    color: '#1f6a46',
    lineHeight: 20,
  },
  errorText: {
    color: '#9f2d2d',
    lineHeight: 20,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: '#cad5cf',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  roleChipSelected: {
    borderColor: '#1f4d3f',
    backgroundColor: '#e6f4ee',
  },
  roleChipText: {
    color: '#405149',
    fontWeight: '600',
  },
  roleChipTextSelected: {
    color: '#173d31',
  },
});
