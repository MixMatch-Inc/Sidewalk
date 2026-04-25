import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../providers/session-provider';

export default function SettingsScreen() {
  const router = useRouter();
  const { email, role, signOut } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email ?? '—'}</Text>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{role ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>App</Text>
        <Text style={styles.value}>Sidewalk · Civic Reporting</Text>
        <Text style={styles.value}>See docs/phase-1-demo-runbook.md for setup help.</Text>
      </View>

      <Pressable onPress={() => void handleLogout()} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fffaf2', gap: 16 },
  heading: { fontSize: 32, fontWeight: '700', color: '#112219' },
  card: { borderRadius: 24, padding: 18, backgroundColor: '#ffffff', gap: 6 },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#2f5d50', fontWeight: '700' },
  value: { color: '#1e2c26', lineHeight: 22 },
  logoutButton: { marginTop: 8, borderRadius: 999, backgroundColor: '#a13a29', padding: 14, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
});
