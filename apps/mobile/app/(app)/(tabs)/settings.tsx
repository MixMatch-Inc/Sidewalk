import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function SettingsPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings placeholder</Text>
      <Text style={styles.copy}>Session controls and profile settings will land here.</Text>
      <Link href="/(auth)/login" style={styles.link}>
        Return to auth shell
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#112219',
  },
  copy: {
    marginTop: 12,
    color: '#51615a',
    lineHeight: 22,
  },
  link: {
    marginTop: 20,
    color: '#1f4d3f',
    fontWeight: '700',
  },
});
