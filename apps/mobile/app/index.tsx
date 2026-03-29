import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { getMobileEnv } from '../src/config/env';

export default function App() {
  const [status, setStatus] = useState<string>('Checking...');
  const [loading, setLoading] = useState(true);
  const { apiUrl } = getMobileEnv();
  const healthEndpoint = `${apiUrl}/api/health`;

  useEffect(() => {
    fetch(healthEndpoint)
      .then((res) => res.json())
      .then((data) => {
        const integrations = data.integrations
          ? Object.entries(data.integrations)
              .map(([name, value]) => `${name}: ${String(value)}`)
              .join('\n')
          : 'No integration details';
        setStatus(`API: ${data.status}\n${integrations}`);
        setLoading(false);
      })
      .catch((err) => {
        setStatus(`Error connecting to API\n${healthEndpoint}`);
        console.error(err);
        setLoading(false);
      });
  }, [healthEndpoint]);

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
