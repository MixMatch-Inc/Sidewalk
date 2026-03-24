import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Sidewalk Mobile</Text>
      <Text style={styles.title}>Auth shell ready.</Text>
      <Text style={styles.copy}>
        This route is the foundation for OTP login and session restore in the next issue batch.
      </Text>
      <Link href="/(app)/(tabs)" style={styles.primaryButton}>
        Continue to app shell
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4efe6',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    marginBottom: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#112219',
  },
  copy: {
    marginTop: 16,
    color: '#405149',
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: '#1f4d3f',
    color: '#f8fff8',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
});
