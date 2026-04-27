import { Types } from 'mongoose';
import crypto from 'crypto';

/**
 * Generate a share-safe public ID (slug) for reports
 * Format: 8-character alphanumeric string
 * Example: "a3b9c2d7"
 */
export function generatePublicSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars[crypto.randomInt(0, chars.length)];
  }
  return slug;
}

/**
 * Generate a deterministic public ID based on internal ID and timestamp
 * This provides consistency while still being non-sequential
 */
export function generateDeterministicSlug(internalId: string | Types.ObjectId): string {
  const idStr = typeof internalId === 'string' ? internalId : internalId.toString();
  const hash = crypto.createHash('sha256');
  hash.update(idStr + process.env.PUBLIC_ID_SALT || 'default-salt');
  const fullHash = hash.digest('hex');
  
  // Take first 8 characters and ensure they start with a letter
  let slug = fullHash.substring(0, 8);
  if (/^[0-9]/.test(slug)) {
    // Replace first character with a letter if it starts with a number
    slug = 'a' + slug.substring(1);
  }
  
  return slug;
}

/**
 * Check if a slug is valid format
 */
export function isValidPublicSlug(slug: string): boolean {
  return /^[a-z][a-z0-9]{7}$/.test(slug);
}

/**
 * Generate a unique public slug with collision resolution
 */
export async function generateUniquePublicSlug(
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = generatePublicSlug();
    const exists = await checkExists(slug);
    
    if (!exists) {
      return slug;
    }
  }
  
  throw new Error(`Failed to generate unique public slug after ${maxAttempts} attempts`);
}
