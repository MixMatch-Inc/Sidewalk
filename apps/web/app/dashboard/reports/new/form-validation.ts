// Issue #143 – Harden report submission form validation and location UX

export type CoordError = { latitude?: string; longitude?: string };

export function validateCoordinates(lat: string, lng: string): CoordError {
  const errors: CoordError = {};
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!lat || isNaN(latNum) || latNum < -90 || latNum > 90) {
    errors.latitude = 'Latitude must be between -90 and 90.';
  }
  if (!lng || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    errors.longitude = 'Longitude must be between -180 and 180.';
  }
  return errors;
}

export function hasCoordErrors(e: CoordError): boolean {
  return Boolean(e.latitude ?? e.longitude);
}

type GeoSuccess = (lat: string, lng: string) => void;
type GeoFailure = (message: string) => void;

export function requestBrowserLocation(onSuccess: GeoSuccess, onFailure: GeoFailure): void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    onFailure('Geolocation is not supported by this browser. Enter coordinates manually.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      onSuccess(String(coords.latitude), String(coords.longitude));
    },
    (err) => {
      const messages: Record<number, string> = {
        1: 'Location access was denied. Enable it in browser settings or enter coordinates manually.',
        2: 'Location unavailable. Check your connection or enter coordinates manually.',
        3: 'Location request timed out. Try again or enter coordinates manually.',
      };
      onFailure(messages[err.code] ?? 'Unable to read location. Enter coordinates manually.');
    },
    { timeout: 8_000 },
  );
}

export function preventDuplicateSubmit(
  isSubmitting: boolean,
  submit: () => Promise<void>,
): () => Promise<void> {
  return async () => {
    if (isSubmitting) return;
    await submit();
  };
}
