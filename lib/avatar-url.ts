/**
 * Helper to normalize and format any avatarUrl representation:
 * - Raw Base64 string -> Data URI
 * - MinIO / S3 URL -> https://minio-s3.astc.joyit.io/...
 * - Empty / null / mock -> null
 */
export function formatAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || url.trim() === "" || url.includes("test.com")) {
    return null;
  }

  const clean = url.trim();

  // 1. Already a Data URI
  if (clean.startsWith("data:image/")) {
    return clean;
  }

  // 2. HTTP / HTTPS (MinIO / S3 / External)
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    let formatted = clean;

    // Replace any internal Docker or localhost MinIO references
    formatted = formatted.replace(/https?:\/\/minio:9000/, "https://minio-s3.astc.joyit.io");
    formatted = formatted.replace(/https?:\/\/localhost:9010/, "https://minio-s3.astc.joyit.io");
    formatted = formatted.replace(/https?:\/\/[^/]+:9010/, "https://minio-s3.astc.joyit.io");

    return formatted;
  }

  // 3. Relative path starting with '/'
  if (clean.startsWith("/")) {
    return clean;
  }

  // 4. Relative MinIO S3 Key (e.g. avatars/... or document/...)
  if (clean.startsWith("avatars/") || clean.startsWith("document/")) {
    return `https://minio-s3.astc.joyit.io/backoffice/${clean}`;
  }
  if (clean.startsWith("smms-assistance/")) {
    return `https://minio-s3.astc.joyit.io/${clean}`;
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
