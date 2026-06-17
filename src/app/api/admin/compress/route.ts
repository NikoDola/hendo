// Server endpoint that converts an admin cover-image upload to AVIF via sharp.
// The admin uploads the raw file straight to Firebase Storage client-side (as
// before — that leg never touches this function), then calls this route with
// just the Storage path. We fetch it with the Admin SDK, compress it, write
// the AVIF version back, and return its URL.
//
// Why a path instead of the file body: Vercel serverless functions hard-cap
// request bodies at 4.5 MB. Cover photos routinely exceed that, so sending the
// raw file through this route's request body would fail with
// FUNCTION_PAYLOAD_TOO_LARGE before our code ever runs. Fetching the bytes
// server-to-server via the Admin SDK has no such limit.

import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { getAdminFromSession } from '@/lib/admin-auth';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { compressToAvif, isAllowedInputImage, ImageError, MAX_RAW_BYTES } from '@/lib/images';

export const runtime = 'nodejs';
export const maxDuration = 60;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return bad('Unauthorized', 401);

  let body: { path?: unknown };
  try {
    body = await request.json();
  } catch {
    return bad('Could not parse request body.');
  }

  const path = body.path;
  // Scope to the cover-image upload prefix only — this is an admin-gated
  // endpoint, but the path still comes from the client, so don't let it be
  // pointed at arbitrary objects in the bucket.
  if (typeof path !== 'string' || !path.startsWith('music/images/')) {
    return bad('A valid music/images/ Storage path is required.');
  }

  try {
    const bucket = firebaseAdmin.storage().bucket();
    const file = bucket.file(path);

    const [meta] = await file.getMetadata().catch(() => [null]);
    if (!meta) return bad('Uploaded file not found in Storage.', 404);
    if (Number(meta.size) > MAX_RAW_BYTES) {
      return bad(`Image must be 15 MB or smaller (${(Number(meta.size) / 1024 / 1024).toFixed(2)} MB given).`);
    }

    const [original] = await file.download();
    if (!isAllowedInputImage(new Uint8Array(original))) {
      return bad('Image file is not a recognized JPG / PNG / WebP / AVIF.');
    }

    const avif = await compressToAvif(original);
    const newPath = path.replace(/\.[^./]+$/, '') + '.avif';
    const token = crypto.randomUUID();

    await bucket.file(newPath).save(avif, {
      metadata: {
        contentType: 'image/avif',
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    if (newPath !== path) {
      await file.delete().catch(() => {});
    }

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media&token=${token}`;
    return NextResponse.json({ url, path: newPath });
  } catch (e) {
    if (e instanceof ImageError) return bad(e.message, 502);
    return bad(e instanceof Error ? e.message : 'Compression failed.', 500);
  }
}
