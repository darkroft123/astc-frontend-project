/**
 * Helper to normalize and format any avatarUrl representation:
 * - Raw Base64 string -> Data URI
 * - Cloudflare R2 / S3 Presigned URL -> returns stable cached URL by object path so browser cache hits instantly
 * - Old dead MinIO URLs (astc-minio, minio-s3, localhost:9010) -> null (shows clean fallback)
 * - Empty / null / mock -> null
 */

const PRESIGNED_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const presignedUrlCache = new Map<string, { url: string; ts: number }>();

export function invalidateAvatarCache() {
  presignedUrlCache.clear();
}

export function formatAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || url.trim() === "" || url.includes("test.com")) {
    return null;
  }

  const clean = url.trim();

  // 1. Already a Data URI
  if (clean.startsWith("data:image/")) {
    return clean;
  }

  // 2. HTTP / HTTPS (Cloudflare R2 / S3 / External)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    if (
      clean.includes("astc-minio.joyit.io") ||
      clean.includes("minio-s3.astc.joyit.io") ||
      clean.includes("minio-s3.astc.local") ||
      clean.includes("minio:9000") ||
      clean.includes(":9010")
    ) {
      return null;
    }

    if (clean.includes("X-Amz-Signature=")) {
      const baseKey = clean.split("?")[0];
      const now = Date.now();
      const existing = presignedUrlCache.get(baseKey);
      if (existing && now - existing.ts < PRESIGNED_CACHE_TTL_MS) {
        return existing.url;
      }
      presignedUrlCache.set(baseKey, { url: clean, ts: now });
    }

    return clean;
  }

  // 3. Relative path starting with '/'
  if (clean.startsWith("/")) {
    return clean;
  }

  // 4. Relative S3 Key without domain
  if (clean.startsWith("avatars/") || clean.startsWith("document/") || clean.startsWith("smms-assistance/")) {
    return null;
  }

  // 5. Raw Base64 string
  if (clean.length > 50 && !clean.includes(" ") && !clean.startsWith("http")) {
    if (clean.startsWith("iVBOR")) {
      return `data:image/png;base64,${clean}`;
    } else if (clean.startsWith("/9j/")) {
      return `data:image/jpeg;base64,${clean}`;
    } else if (clean.startsWith("R0lGOD")) {
      return `data:image/gif;base64,${clean}`;
    } else if (clean.startsWith("UklGR")) {
      return `data:image/webp;base64,${clean}`;
    }
    return `data:image/jpeg;base64,${clean}`;
  }

  return null;
}
