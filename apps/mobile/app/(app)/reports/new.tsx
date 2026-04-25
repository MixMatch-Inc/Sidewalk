import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { startTransition, useMemo, useState } from 'react';
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
import { authorizedApiFetch, authorizedFetch } from '../../lib/api';
import { ReportPill, ReportPillRow } from '../../components/report-pills';
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

type CreateMediaDraftResponse = {
  draftId: string;
};

type UploadMediaResponse = {
  url: string;
};

type FieldErrors = Partial<Record<'title' | 'description' | 'latitude' | 'longitude', string>>;

type SelectedImage = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  size: number | null;
  uploadState: 'ready' | 'uploading' | 'uploaded' | 'failed';
  uploadedUrl: string | null;
  error: string | null;
};

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const inferMimeType = (asset: ImagePicker.ImagePickerAsset) => {
  if (asset.mimeType && allowedMimeTypes.has(asset.mimeType)) {
    return asset.mimeType;
  }

  const normalizedUri = asset.uri.toLowerCase();
  if (normalizedUri.endsWith('.jpg') || normalizedUri.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalizedUri.endsWith('.png')) {
    return 'image/png';
  }
  if (normalizedUri.endsWith('.webp')) {
    return 'image/webp';
  }

  return null;
};

const buildImageId = (asset: ImagePicker.ImagePickerAsset, index: number) =>
  `${asset.assetId ?? asset.uri}-${index}`;

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const uploadingCount = useMemo(
    () => selectedImages.filter((image) => image.uploadState === 'uploading').length,
    [selectedImages],
  );

  const resetFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

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
      resetFieldError('latitude');
      resetFieldError('longitude');
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
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo library permission is required to select report images.');
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

      const unsupported = result.assets.filter((asset) => !inferMimeType(asset));
      if (unsupported.length > 0) {
        setError('Only JPEG, PNG, and WebP images are supported right now.');
      }

      const nextImages: SelectedImage[] = [];
      result.assets.forEach((asset, index) => {
        const mimeType = inferMimeType(asset);
        if (!mimeType) {
          return;
        }

        nextImages.push({
          id: buildImageId(asset, index),
          uri: asset.uri,
          name: asset.fileName ?? `selected-image-${index + 1}.jpg`,
          mimeType,
          size: asset.fileSize ?? null,
          uploadState: 'ready',
          uploadedUrl: null,
          error: null,
        });
      });

      startTransition(() => {
        setSelectedImages(nextImages);
      });
    } catch (pickerError) {
      setError(pickerError instanceof Error ? pickerError.message : 'Unable to pick images.');
    } finally {
      setIsPickingImages(false);
    }
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    const parsedLatitude = Number(latitude);
    if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
      nextErrors.latitude = 'Latitude must be between -90 and 90.';
    }

    const parsedLongitude = Number(longitude);
    if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      nextErrors.longitude = 'Longitude must be between -180 and 180.';
    }

    setFieldErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      parsedLatitude,
      parsedLongitude,
    };
  };

  const markImageState = (
    imageId: string,
    updates: Partial<Pick<SelectedImage, 'uploadState' | 'uploadedUrl' | 'error'>>,
  ) => {
    setSelectedImages((currentImages) =>
      currentImages.map((image) => (image.id === imageId ? { ...image, ...updates } : image)),
    );
  };

  const uploadImages = async (draftId: string) => {
    if (!accessToken || selectedImages.length === 0) {
      return [];
    }

    const uploadedUrls: string[] = [];

    for (const image of selectedImages) {
      markImageState(image.id, { uploadState: 'uploading', error: null });

      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        name: image.name,
        type: image.mimeType,
      } as never);

      try {
        const response = await authorizedFetch('/api/media/upload', accessToken, {
          method: 'POST',
          contentType: null,
          headers: {
            'x-media-draft-id': draftId,
          },
          body: formData,
        });

        const payload = (await response.json()) as UploadMediaResponse & {
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error?.message ?? 'Image upload failed.');
        }

        uploadedUrls.push(payload.url);
        markImageState(image.id, {
          uploadState: 'uploaded',
          uploadedUrl: payload.url,
          error: null,
        });
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : 'Image upload failed.';
        markImageState(image.id, {
          uploadState: 'failed',
          error: message,
        });
        throw new Error(`Unable to upload "${image.name}". ${message}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setError('Your session expired. Sign in again to submit a report.');
      return;
    }

    if (isSubmitting) {
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      setError('Fix the highlighted fields before submitting your report.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const draftPayload =
        selectedImages.length > 0
          ? await authorizedApiFetch<CreateMediaDraftResponse>('/api/media/drafts', accessToken, {
              method: 'POST',
              body: JSON.stringify({}),
            })
          : null;

      const uploadedUrls = draftPayload ? await uploadImages(draftPayload.draftId) : [];

      const payload = await authorizedApiFetch<CreateReportResponse>(
        '/api/reports',
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            category,
            draft_id: draftPayload?.draftId,
            media_urls: uploadedUrls,
            location: {
              type: 'Point',
              coordinates: [validation.parsedLongitude, validation.parsedLatitude],
            },
          }),
        },
      );

      const pendingMessage =
        payload.anchor_status === 'ANCHOR_QUEUED'
          ? 'Report accepted. Anchoring is queued and will finish shortly.'
          : 'Report accepted successfully.';

      setSuccessMessage(pendingMessage);

      setTimeout(() => {
        router.replace({
          pathname: '/(app)/reports/[reportId]',
          params: {
            reportId: payload.report_id,
            justSubmitted: '1',
            anchorStatus: payload.anchor_status,
          },
        });
      }, 500);
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
          Submit a report with text, coordinates, and image evidence. Media uploads are attached
          before the report is created so the final submission stays consistent.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            onChangeText={(value) => {
              setTitle(value);
              resetFieldError('title');
            }}
            placeholder="Flooded drainage near Oba Akran"
            placeholderTextColor="#7b8c84"
            style={[styles.input, fieldErrors.title ? styles.inputError : null]}
            value={title}
          />
          {fieldErrors.title ? <Text style={styles.fieldError}>{fieldErrors.title}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            numberOfLines={5}
            onChangeText={(value) => {
              setDescription(value);
              resetFieldError('description');
            }}
            placeholder="Describe what is happening, where it is, and how it affects people."
            placeholderTextColor="#7b8c84"
            style={[styles.input, styles.textArea, fieldErrors.description ? styles.inputError : null]}
            textAlignVertical="top"
            value={description}
          />
          {fieldErrors.description ? (
            <Text style={styles.fieldError}>{fieldErrors.description}</Text>
          ) : null}

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {reportCategories.map((option) => (
              <Pressable
                key={option}
                onPress={() => setCategory(option)}
                style={[
                  styles.categoryChip,
                  category === option ? styles.categoryChipSelected : null,
                ]}
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
                onChangeText={(value) => {
                  setLatitude(value);
                  resetFieldError('latitude');
                }}
                placeholder="6.6018"
                placeholderTextColor="#7b8c84"
                style={[styles.input, fieldErrors.latitude ? styles.inputError : null]}
                value={latitude}
              />
              {fieldErrors.latitude ? (
                <Text style={styles.fieldError}>{fieldErrors.latitude}</Text>
              ) : null}
            </View>
            <View style={styles.coordinateField}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={(value) => {
                  setLongitude(value);
                  resetFieldError('longitude');
                }}
                placeholder="3.3515"
                placeholderTextColor="#7b8c84"
                style={[styles.input, fieldErrors.longitude ? styles.inputError : null]}
                value={longitude}
              />
              {fieldErrors.longitude ? (
                <Text style={styles.fieldError}>{fieldErrors.longitude}</Text>
              ) : null}
            </View>
          </View>

          <Pressable
            disabled={isLocating || isSubmitting}
            onPress={handleUseCurrentLocation}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed || isLocating || isSubmitting ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {isLocating ? 'Reading current location…' : 'Use current location'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Images</Text>
          <Text style={styles.helperText}>
            Supported formats: JPEG, PNG, and WebP. Images upload first, then the report is
            submitted with the final media URLs.
          </Text>

          <Pressable
            disabled={isPickingImages || isSubmitting}
            onPress={handlePickImages}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed || isPickingImages || isSubmitting ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {isPickingImages ? 'Opening photo library…' : 'Select images'}
            </Text>
          </Pressable>

          {selectedImages.length > 0 ? (
            <View style={styles.imageList}>
              {selectedImages.map((image) => (
                <View key={image.id} style={styles.imageCard}>
                  <Image contentFit="cover" source={{ uri: image.uri }} style={styles.imagePreview} />
                  <Text numberOfLines={1} style={styles.imageName}>
                    {image.name}
                  </Text>
                  <ReportPill
                    label={
                      image.uploadState === 'ready'
                        ? 'Ready'
                        : image.uploadState === 'uploading'
                          ? 'Uploading'
                          : image.uploadState === 'uploaded'
                            ? 'Uploaded'
                            : 'Failed'
                    }
                    value={
                      image.uploadState === 'uploaded'
                        ? 'ANCHOR_SUCCESS'
                        : image.uploadState === 'failed'
                          ? 'ANCHOR_FAILED'
                          : 'ANCHOR_QUEUED'
                    }
                  />
                  {image.error ? <Text style={styles.fieldError}>{image.error}</Text> : null}
                  <Pressable
                    disabled={isSubmitting || image.uploadState === 'uploading'}
                    onPress={() =>
                      setSelectedImages((currentImages) =>
                        currentImages.filter((currentImage) => currentImage.id !== image.id),
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Submission State</Text>
          <ReportPillRow
            items={[
              { value: 'PENDING', label: isSubmitting ? 'Submitting' : 'Ready to submit' },
              {
                value: uploadingCount > 0 ? 'ANCHOR_QUEUED' : 'ANCHOR_SUCCESS',
                label:
                  uploadingCount > 0
                    ? `${uploadingCount} image${uploadingCount === 1 ? '' : 's'} uploading`
                    : 'Uploads prepared',
              },
            ]}
          />
          <Text style={styles.helperText}>
            Report submission is locked while uploads or the final create request are in flight.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable
          disabled={isSubmitting || isLocating || isPickingImages}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed || isSubmitting || isLocating || isPickingImages ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Submitting report…' : 'Submit report'}
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
  inputError: {
    borderColor: '#c76a5c',
  },
  fieldError: {
    color: '#9f2d2d',
    lineHeight: 20,
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
  successText: {
    color: '#1f6a46',
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
    width: 108,
    gap: 6,
  },
  imagePreview: {
    width: 108,
    height: 108,
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
