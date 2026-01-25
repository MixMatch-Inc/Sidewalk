import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

export default function App() {
  const [status, setStatus] = useState<string>('Checking...');
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5001/api/health';

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setStatus(`API: ${data.status}\nStellar: ${data.stellar_connected}`);
        setLoading(false);
      })
      .catch((err) => {
        setStatus('Error connecting to API');
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sidewalk 🌍</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Text style={styles.status}>{status}</Text>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
