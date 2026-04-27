import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export interface ThreadEntry {
  id: string;
  body: string;
  author: string;
  isAgencyUpdate: boolean;
  createdAt: string;
}

function ThreadItem({ entry }: { entry: ThreadEntry }) {
  return (
    <View style={[styles.item, entry.isAgencyUpdate && styles.agency]}>
      <Text style={styles.author}>
        {entry.isAgencyUpdate ? '🏛 ' : '💬 '}
        {entry.author}
      </Text>
      <Text style={styles.body}>{entry.body}</Text>
      <Text style={styles.date}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
    </View>
  );
}

export function CommentThread({ entries }: { entries: ThreadEntry[] }) {
  if (!entries.length) {
    return <Text style={styles.empty}>No comments yet.</Text>;
  }
  return (
    <FlatList
      data={entries}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => <ThreadItem entry={item} />}
    />
  );
}

const styles = StyleSheet.create({
  item: { padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  agency: { backgroundColor: '#f0f7ff' },
  author: { fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 14, color: '#333' },
  date: { fontSize: 11, color: '#999', marginTop: 4 },
  empty: { padding: 16, color: '#999', textAlign: 'center' },
});
