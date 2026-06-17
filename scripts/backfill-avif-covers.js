// One-off backfill: re-encode existing music cover images (uploaded before the
// AVIF pipeline existed) to AVIF, upload alongside the originals, and point the
// Firestore `music` docs at the new file. Originals are left in Storage untouched
// unless --delete-old is passed, so this is safe to re-run and easy to undo.
//
// Usage (from the hendo project root):
//   node --env-file=.env.local scripts/backfill-avif-covers.js           # dry run
//   node --env-file=.env.local scripts/backfill-avif-covers.js --apply   # writes
//   node --env-file=.env.local scripts/backfill-avif-covers.js --apply --delete-old

const crypto = require('crypto');
const admin = require('firebase-admin');
const sharp = require('sharp');

const APPLY = process.argv.includes('--apply');
const DELETE_OLD = process.argv.includes('--delete-old');

const TARGET_COVER_AVIF_BYTES = 150 * 1024;
const QUALITY_STEPS = [65, 58, 50, 42, 35, 28, 22];
const WIDTH_STEPS = [1600, 1280, 1024, 800, 640, 512, 400];

function inputImageExtension(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return 'png';
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'webp';
  if (bytes.length >= 32 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const head = Buffer.from(bytes.slice(0, Math.min(64, bytes.length))).toString('ascii');
    if (head.includes('avif') || head.includes('avis')) return 'avif';
  }
  return null;
}

async function compressToAvif(input, maxBytes = TARGET_COVER_AVIF_BYTES) {
  if (inputImageExtension(new Uint8Array(input)) === 'avif' && input.length <= maxBytes) return input;
  let smallest = null;
  for (const width of WIDTH_STEPS) {
    for (const quality of QUALITY_STEPS) {
      const out = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .avif({ quality, effort: 4, chromaSubsampling: '4:2:0' })
        .toBuffer();
      if (out.length <= maxBytes) return out;
      if (!smallest || out.length < smallest.length) smallest = out;
    }
  }
  return smallest;
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error('Missing/invalid Firebase admin credentials in env.');
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    projectId,
    storageBucket,
  });
}

async function main() {
  initFirebase();
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  const snap = await db.collection('music').get();
  console.log(`Found ${snap.size} track(s). Mode: ${APPLY ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const { imageFileUrl, imageFileName, title } = data;

    if (!imageFileUrl || !imageFileName) {
      console.log(`[skip] ${doc.id} "${title}" — no cover image`);
      skipped++;
      continue;
    }
    if (imageFileName.toLowerCase().endsWith('.avif')) {
      console.log(`[skip] ${doc.id} "${title}" — already AVIF`);
      skipped++;
      continue;
    }

    try {
      const file = bucket.file(imageFileName);
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`[skip] ${doc.id} "${title}" — storage object missing: ${imageFileName}`);
        skipped++;
        continue;
      }

      const [original] = await file.download();
      const ext = inputImageExtension(new Uint8Array(original));
      if (!ext) {
        console.log(`[skip] ${doc.id} "${title}" — unrecognized image format`);
        skipped++;
        continue;
      }

      const avif = await compressToAvif(original);
      const newFileName = imageFileName.replace(/\.[^./]+$/, '') + '.avif';
      const token = crypto.randomUUID();

      console.log(
        `[${APPLY ? 'migrate' : 'would-migrate'}] ${doc.id} "${title}" — ` +
        `${original.length} bytes -> ${avif.length} bytes (${newFileName})`
      );

      if (APPLY) {
        const newFile = bucket.file(newFileName);
        await newFile.save(avif, {
          metadata: {
            contentType: 'image/avif',
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });
        const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newFileName)}?alt=media&token=${token}`;

        await doc.ref.update({ imageFileUrl: newUrl, imageFileName: newFileName });

        if (DELETE_OLD) {
          await file.delete().catch((e) => console.warn(`  (could not delete old file: ${e.message})`));
        }
      }
      migrated++;
    } catch (e) {
      console.error(`[fail] ${doc.id} "${title}":`, e.message || e);
      failed++;
    }
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  if (!APPLY && migrated > 0) {
    console.log('Dry run only — re-run with --apply to actually write changes.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
