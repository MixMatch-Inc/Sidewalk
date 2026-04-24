import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authorizedApiFetch } from '../../lib/api';
import { useSession } from '../../providers/session-provider';

const reportCategories = [
  'INFRASTRUCTURE',
  'SANITATION',
  'SAFETY',
  'LIGHTING',
  'TRANSPORT',
  'DRAINAGE',
  'UTILITIES',
  'TRAFFIC',
  'OTHER',
] as const;

type ReportCategory = (typeof reportCategories)[number];

type CreateReportResponse = {
  report_id: string;
  anchor_status: string;
};

type SelectedImage = {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
};

export default function NewReportScreen() {
  const router = useRouter();
  const { accessToken } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('INFRASTRUCTURE');
  const [latitude, setLatitude] = useState('6.6018');
  const [longitude, setLongitude] = useState('3.3515');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location permission was denied. You can still enter coordinates manually.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : 'Unable to determine current location.',
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickImages = async () => {
    setIsPickingImages(true);
    setMediaMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMediaMessage('Photo library permission is required to select report images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (result.canceled) {
        return;
      }

      setSelectedImages(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `selected-image-${index + 1}.jpg`,
          mimeType: asset.mimeType ?? null,
          size: asset.fileSize ?? null,
        })),
      );

      setMediaMessage(
        `${result.assets.length} image${result.assets.length === 1 ? '' : 's'} selected. Upload wiring lands in the next mobile batch.`,
      );
    } catch (pickerError) {
      setMediaMessage(
        pickerError instanceof Error ? pickerError.message : 'Unable to pick images.',
      );
    } finally {
      setIsPickingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setError('Your session expired. Sign in again to submit a report.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      setError('Enter valid latitude and longitude values before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await authorizedApiFetch<CreateReportResponse>(
        '/api/reports',
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            media_urls: [],
            location: {
              type: 'Point',
              coordinates: [parsedLongitude, parsedLatitude],
            },
          }),
        },
      );

      router.replace(`/(app)/reports/${payload.report_id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Create Report</Text>
        <Text style={styles.title}>Capture the issue clearly.</Text>
        <Text style={styles.copy}>
          Submit a citizen report with structured details, current coordinates, and prepared
          image attachments for the upcoming upload flow.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Flooded drainage near Oba Akran"
            placeholderTextColor="#7b8c84"
            style={styles.input}
            value={title}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={setDescription}
            placeholder="Describe what is happening, where it is, and how it affects people."
            placeholderTextColor="#7b8c84"
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={description}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {reportCategories.map((option) => (
              <Pressable
                key={option}
                onPress={() => setCategory(option)}
                style={[styles.categoryChip, category === option ? styles.categoryChipSelected : null]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === option ? styles.categoryChipTextSelected : null,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateField}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setLatitude}
                placeholder="6.6018"
                placeholderTextColor="#7b8c84"
                style={styles.input}
                value={latitude}
              />
            </View>
            <View style={styles.coordinateField}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setLongitude}
                placeholder="3.3515"
                placeholderTextColor="#7b8c84"
                style={styles.input}
                value={longitude}
              />
            </View>
          </View>

          <Pressable onPress={handleUseCurrentLocation} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {isLocating ? 'Reading current location…' : 'Use current location'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.helperText}>
            Select image attachments now. Submission in this batch still sends text and location
            only; upload wiring follows in the next mobile batch.
          </Text>

          <Pressable onPress={handlePickImages} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {isPickingImages ? 'Opening photo library…' : 'Select images'}
            </Text>
          </Pressable>

          {mediaMessage ? <Text style={styles.helperText}>{mediaMessage}</Text> : null}

          {selectedImages.length > 0 ? (
            <View style={styles.imageList}>
              {selectedImages.map((image) => (
                <View key={image.uri} style={styles.imageCard}>
                  <Image contentFit="cover" source={{ uri: image.uri }} style={styles.imagePreview} />
                  <Text numberOfLines={1} style={styles.imageName}>
                    {image.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      setSelectedImages((currentImages) =>
                        currentImages.filter((currentImage) => currentImage.uri !== image.uri),
                      )
                    }
                    style={styles.removeImageButton}
                  >
                    <Text style={styles.removeImageButtonText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed || isSubmitting ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#fffaf2',
  },
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: '#fffaf2',
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#2f5d50',
    fontWeight: '700',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#112219',
  },
  copy: {
    color: '#405149',
    lineHeight: 22,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#112219',
  },
  label: {
    fontWeight: '600',
    color: '#1e2c26',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7d0c2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    color: '#112219',
  },
  textArea: {
    minHeight: 120,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: '#cad5cf',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  categoryChipSelected: {
    borderColor: '#1f4d3f',
    backgroundColor: '#e7f4ee',
  },
  categoryChipText: {
    color: '#405149',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryChipTextSelected: {
    color: '#173d31',
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateField: {
    flex: 1,
    gap: 8,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#1f4d3f',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#f8fff8',
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#cad5cf',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#173d31',
    fontWeight: '700',
  },
  helperText: {
    color: '#51615a',
    lineHeight: 21,
  },
  errorText: {
    color: '#9f2d2d',
    lineHeight: 21,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageCard: {
    width: 96,
    gap: 6,
  },
  imagePreview: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#f1ece3',
  },
  imageName: {
    color: '#405149',
    fontSize: 12,
  },
  removeImageButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  removeImageButtonText: {
    color: '#9f2d2d',
    fontSize: 12,
    fontWeight: '700',
  },
});
