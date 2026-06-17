// Server endpoint that converts admin cover-image uploads to AVIF via sharp.
// Every cover image the admin selects is sent here before it is uploaded to
// Firebase Storage, so the storefront only ever ships small AVIF assets.

import { NextResponse, type NextRequest } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { compressToAvif, isAllowedInputImage, ImageError, MAX_RAW_BYTES } from '@/lib/images';

export const runtime = 'nodejs';
export const maxDuration = 60;

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminFromSession();
  if (!admin) return bad('Unauthorized', 401);

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return bad('Could not parse form data.');
  }

  const file = fd.get('image');
  if (!(file instanceof File) || file.size === 0) return bad('Image is required.');
  if (file.size > MAX_RAW_BYTES) {
    return bad(`Image must be 15 MB or smaller (${(file.size / 1024 / 1024).toFixed(2)} MB given).`);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!isAllowedInputImage(new Uint8Array(buf))) {
    return bad('Image file is not a recognized JPG / PNG / WebP / AVIF.');
  }

  try {
    const out = await compressToAvif(buf);
    return new NextResponse(out as unknown as BodyInit, {
      status: 200,
      headers: { 'Content-Type': 'image/avif', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (e instanceof ImageError) return bad(e.message, 502);
    return bad(e instanceof Error ? e.message : 'Compression failed.', 500);
  }
}
