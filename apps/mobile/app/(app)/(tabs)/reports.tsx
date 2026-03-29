import { StyleSheet, Text, View } from 'react-native';

export default function ReportsPlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports tab placeholder</Text>
      <Text style={styles.copy}>
        This tab is reserved for mobile report submission and history screens in the next
        issue batches.
      </Text>
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
});
