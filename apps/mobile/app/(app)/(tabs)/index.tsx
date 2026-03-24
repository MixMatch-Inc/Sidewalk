import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Mobile Foundation</Text>
      <Text style={styles.title}>Signed-in app shell.</Text>
      <Text style={styles.copy}>
        Tabs, routing, environment-aware API helpers, and session context are in place for
        report and auth flows.
      </Text>
      <Link href="/(app)/(tabs)/reports" style={styles.secondaryButton}>
        Open reports tab
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fffaf2',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    marginBottom: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#112219',
  },
  copy: {
    marginTop: 16,
    color: '#405149',
    lineHeight: 22,
  },
  secondaryButton: {
    marginTop: 24,
    borderColor: '#d9d0bf',
    borderWidth: 1,
    color: '#112219',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '700',
  },
});
