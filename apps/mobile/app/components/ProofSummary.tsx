import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ProofMeta {
  anchorStatus: 'pending' | 'anchored' | 'failed';
  txHash?: string;
  verificationResult?: boolean;
  explorerUrl?: string;
}

const STATUS_LABEL: Record<ProofMeta['anchorStatus'], string> = {
  pending: '⏳ Verification in progress',
  anchored: '✅ Verified on public ledger',
  failed: '❌ Verification failed',
};

export function ProofSummary({ proof }: { proof: ProofMeta }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Report Verification</Text>
      <Text style={styles.status}>{STATUS_LABEL[proof.anchorStatus]}</Text>

      {proof.txHash && (
        <Text style={styles.hash} numberOfLines={1}>
          TX: {proof.txHash}
        </Text>
      )}

      {proof.explorerUrl && (
        <TouchableOpacity onPress={() => Linking.openURL(proof.explorerUrl!)}>
          <Text style={styles.link}>View on explorer →</Text>
        </TouchableOpacity>
      )}

      {proof.anchorStatus === 'pending' && (
        <Text style={styles.note}>
          This report has been submitted and is awaiting ledger confirmation.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fafafa', borderRadius: 8, margin: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  status: { fontSize: 14, marginBottom: 8 },
  hash: { fontSize: 11, color: '#666', marginBottom: 8 },
  link: { color: '#0066cc', marginBottom: 8 },
  note: { fontSize: 12, color: '#888', fontStyle: 'italic' },
});
