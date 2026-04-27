/** Attachment preview carousel for report detail (issue #212) */

import React, { useState } from "react";
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";

interface Props {
  urls: string[];
}

const { width } = Dimensions.get("window");

export function AttachmentCarousel({ urls }: Props) {
  const [fullscreen, setFullscreen] = useState<string | null>(null);

  if (!urls.length) return null;

  return (
    <View>
      <FlatList
        horizontal
        data={urls}
        keyExtractor={(item, i) => `${item}-${i}`}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setFullscreen(item)}>
            <Image
              source={{ uri: item }}
              style={styles.thumb}
              onError={() => {/* fail silently */}}
              accessibilityLabel="Report attachment"
            />
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
      />

      <Modal visible={!!fullscreen} transparent animationType="fade">
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.close} onPress={() => setFullscreen(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {fullscreen && (
            <Image source={{ uri: fullscreen }} style={styles.full} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
  overlay: { flex: 1, backgroundColor: "#000d", justifyContent: "center", alignItems: "center" },
  full: { width, height: width },
  close: { position: "absolute", top: 48, right: 20 },
  closeText: { color: "#fff", fontSize: 24 },
});
