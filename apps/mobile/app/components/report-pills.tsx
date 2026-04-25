import { StyleSheet, Text, View } from 'react-native';

type PillTone = 'neutral' | 'success' | 'warning' | 'danger';

const toneByStatus: Record<string, PillTone> = {
  PENDING: 'warning',
  ACKNOWLEDGED: 'neutral',
  RESOLVED: 'success',
  REJECTED: 'danger',
  ESCALATED: 'warning',
  ANCHOR_QUEUED: 'warning',
  ANCHOR_SUCCESS: 'success',
  ANCHOR_FAILED: 'danger',
  NORMAL: 'success',
  SUSPICIOUS: 'danger',
};

const labelize = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const stylesForTone = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  neutral: {
    backgroundColor: '#edf1f3',
    borderColor: '#cbd5db',
  },
  success: {
    backgroundColor: '#e7f4ee',
    borderColor: '#8ab79d',
  },
  warning: {
    backgroundColor: '#fbefcf',
    borderColor: '#d4b15c',
  },
  danger: {
    backgroundColor: '#f9e3df',
    borderColor: '#cf8a7b',
  },
  text: {
    color: '#173d31',
    fontSize: 12,
    fontWeight: '700',
  },
});

export function ReportPill({
  value,
  label,
}: Readonly<{
  value: string;
  label?: string;
}>) {
  const tone = toneByStatus[value] ?? 'neutral';

  return (
    <View style={[stylesForTone.base, stylesForTone[tone]]}>
      <Text style={stylesForTone.text}>{label ?? labelize(value)}</Text>
    </View>
  );
}

export function ReportPillRow({
  items,
}: Readonly<{
  items: { value: string; label?: string }[];
}>) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <ReportPill key={`${item.value}-${item.label ?? ''}`} label={item.label} value={item.value} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
