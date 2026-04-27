import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { useSession } from './providers/session-provider';
import { parsePublicReportUrl } from './lib/public-report-link';

export default function IndexScreen() {
  const { accessToken, isHydrating } = useSession();
  const router = useRouter();

  useEffect(() => {
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (!initialUrl) {
        return;
      }

      const reportId = parsePublicReportUrl(initialUrl);
      if (!reportId) {
        return;
      }

      if (accessToken) {
        router.replace(`/(app)/reports/${reportId}`);
      } else {
        router.replace({
          pathname: '/(auth)/login',
          params: { returnTo: `/(app)/reports/${reportId}` },
        });
      }
    };

    void handleInitialUrl();
  }, [accessToken, router]);

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f4d3f" />
      </View>
    );
  }

  return <Redirect href={accessToken ? '/(app)/(tabs)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffaf2',
  },
});
