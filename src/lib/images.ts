// Server-side image compression for admin uploads. Every cover image the admin
// selects is converted to AVIF here before it's stored, so the storefront only
// ever ships small, consistently-sized assets regardless of what was uploaded
// (fixes blurry mobile thumbnails caused by raw, unprocessed admin uploads).

import sharp from "sharp";

export const TARGET_COVER_AVIF_BYTES = 150 * 1024;
export const MAX_RAW_BYTES = 15 * 1024 * 1024;

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageError";
  }
}

/**
 * Magic-byte check: returns true for JPG / PNG / WebP / AVIF inputs.
 * AVIF is in the ISO BMFF container — bytes 4-7 == "ftyp" and the brand
 * "avif" (or "avis") appears in the first 64 bytes.
 */
export function isAllowedInputImage(bytes: Uint8Array): boolean {
  return inputImageExtension(bytes) !== null;
}

export function inputImageExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | "avif" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg"; // JPEG
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "png"; // PNG
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp"; // WebP

  // AVIF: bytes 4..7 = "ftyp", and "avif" appears within first 64 bytes
  if (
    bytes.length >= 32 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const head = Buffer.from(bytes.slice(0, Math.min(64, bytes.length))).toString("ascii");
    if (head.includes("avif") || head.includes("avis")) return "avif";
  }
  return null;
}

/**
 * Validates that Sharp can decode the given buffer.
 * Throws ImageError with a readable message if it can't, so the API route
 * returns a 502 instead of an unhandled 500.
 */
async function assertSharpCanDecode(input: Buffer): Promise<void> {
  try {
    await sharp(input).metadata();
  } catch (e) {
    throw new ImageError(
      `This image could not be read: ${e instanceof Error ? e.message.split("\n")[0] : "unsupported format"}.` +
        " Try re-saving the file as a JPG, PNG, or WebP before uploading.",
    );
  }
}

/**
 * Compresses an image buffer to AVIF, stepping quality and width down until the
 * result is <= maxBytes. Throws ImageError if the image can't be decoded or if
 * even the smallest profile can't fit within maxBytes.
 *
 * Width steps top out at 1600 — well above the largest size any cover art
 * actually renders at (full-bleed mobile cards), even at 3x DPR.
 */
export async function compressToAvif(input: Buffer, maxBytes: number = TARGET_COVER_AVIF_BYTES): Promise<Buffer> {
  // If the input is already AVIF and fits within the budget, pass it through.
  // Some AVIF encoder profiles can be read by sharp's libheif for metadata but
  // not for transcoding; bypassing re-encode avoids "bad seek" / "bitstream not
  // supported" errors without any quality loss.
  if (inputImageExtension(new Uint8Array(input)) === "avif" && input.length <= maxBytes) return input;

  await assertSharpCanDecode(input);

  const qualitySteps = [65, 58, 50, 42, 35, 28, 22];
  const widthSteps = [1600, 1280, 1024, 800, 640, 512, 400];
  let smallest: Buffer | null = null;
  for (const width of widthSteps) {
    for (const quality of qualitySteps) {
      const out = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .avif({ quality, effort: 4, chromaSubsampling: "4:2:0" })
        .toBuffer();
      if (out.length <= maxBytes) return out;
      if (!smallest || out.length < smallest.length) smallest = out;
    }
  }
  throw new ImageError(
    `Could not compress image below ${Math.round(maxBytes / 1024)} KB ` +
      `(smallest: ${smallest ? (smallest.length / 1024).toFixed(1) : "?"} KB).`,
  );
}
