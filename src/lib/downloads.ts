// Download generation utilities for purchased music tracks
import JSZip from 'jszip';
import { firebaseAdmin } from '@/lib/firebaseAdmin';
import { getMusicTrackServer } from '@/lib/music-server';

// We'll use a simple approach without pdfmake to avoid font issues
import { jsPDF } from 'jspdf';

interface DownloadPackage {
  zipUrl: string;
  pdfUrl: string;
  expiresAt: Date;
}

interface CollectionDownloadPackage {
  zipUrl: string;
  expiresAt: Date;
  items: Array<{ trackId: string; trackTitle: string; price: number }>;
}

function sanitizeFolderName(input: string): string {
  const cleaned = (input || 'track')
    .trim()
    // replace path separators and reserved chars
    .replace(/[\\/:*?"<>|]+/g, '_')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > 0 ? cleaned : 'track';
}

function inferExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop() || '';
    const decoded = decodeURIComponent(last);
    const ext = decoded.includes('.') ? decoded.split('.').pop() : '';
    const safe = (ext || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return safe.length > 0 ? safe : 'mp3';
  } catch {
    return 'mp3';
  }
}

/**
 * Generates a ZIP file containing the purchased music track and PDF
 */
async function generateZipFile(
  audioFileUrl: string, 
  trackTitle: string, 
  pdfBuffer: Buffer
): Promise<Buffer> {
  try {
    // Download the audio file from Firebase Storage URL
    const audioResponse = await fetch(audioFileUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
    }
    
    const audioBlob = await audioResponse.blob();
    const audioArrayBuffer = await audioBlob.arrayBuffer();
    
    // Create ZIP file
    const zip = new JSZip();
    
    // Clean filename - decode URL encoding and sanitize
    const urlPath = new URL(audioFileUrl).pathname;
    let fileName = urlPath.split('/').pop() || `${trackTitle}.mp3`;
    // Decode URL encoding (e.g., %2F becomes /, %2C becomes ,)
    try {
      fileName = decodeURIComponent(fileName);
    } catch {
      // If decoding fails, use original
      console.warn('Failed to decode filename, using original:', fileName);
    }
    // Sanitize filename - remove invalid characters but keep extension
    const sanitizedTitle = trackTitle.replace(/[^a-z0-9]/gi, '_');
    const extension = fileName.split('.').pop() || 'mp3';
    const cleanFileName = `${sanitizedTitle}.${extension}`;
    
    // Add audio file to ZIP with clean filename
    zip.file(cleanFileName, audioArrayBuffer);
    
    // Add PDF to ZIP
    const pdfFileName = `${sanitizedTitle}_Beat_Lease_Agreement.pdf`;
    zip.file(pdfFileName, pdfBuffer);
    
    // Generate ZIP as buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return zipBuffer;
  } catch (error) {
    console.error('Error generating ZIP file:', error);
    throw new Error('Failed to generate ZIP file');
  }
}

type LeaseBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'space'; size?: number };

/**
 * Builds the full long-form Beat Lease Agreement, autofilled with the buyer's
 * details, the purchased beat, and the actual price paid (used as the Lease Fee).
 * Mirrors `public/lease/BEAT LEASE AGREEMENT.pdf`.
 */
function buildBeatLeaseBlocks(
  trackTitle: string,
  userName: string,
  userEmail: string,
  purchaseDate: Date,
  price: number,
  fileFormat: string
): LeaseBlock[] {
  const dateStr = purchaseDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const priceStr = `$${price.toFixed(2)}`;
  const licensee = userName && userName.trim().length > 0 ? userName : 'Licensee';

  return [
    { kind: 'title', text: 'BEAT LEASE AGREEMENT' },
    { kind: 'subtitle', text: 'BEAT LEASE LICENSE AGREEMENT' },
    { kind: 'space', size: 4 },
    {
      kind: 'paragraph',
      text: `This Beat Lease License Agreement (the "Agreement") is made effective as of ${dateStr} ("Effective Date"), by and between:`,
    },

    { kind: 'heading', text: 'Licensor:' },
    { kind: 'paragraph', text: 'T. Hendo' },
    { kind: 'paragraph', text: '30 N. Gould St Ste R, Sheridan, WY 82801' },
    { kind: 'paragraph', text: '("Licensor")' },

    { kind: 'heading', text: 'Licensee:' },
    { kind: 'paragraph', text: licensee },
    { kind: 'paragraph', text: userEmail },
    { kind: 'paragraph', text: '("Licensee")' },

    { kind: 'heading', text: 'Recitals:' },
    { kind: 'paragraph', text: 'WHEREAS, Licensor is the owner of certain music compositions and sound recordings ("Beat");' },
    { kind: 'paragraph', text: 'WHEREAS, Licensee desires to lease the right to use the Beat for specific purposes, and Licensor agrees to grant such rights under the terms set forth in this Agreement;' },
    { kind: 'paragraph', text: 'NOW, THEREFORE, in consideration of the mutual covenants and promises contained herein, the parties agree as follows:' },

    { kind: 'heading', text: '1. Grant of License' },
    { kind: 'paragraph', text: '1.1 License: Licensor hereby grants to Licensee a non-exclusive, non-transferable, revocable license to use the Beat described below for the following purposes:' },
    { kind: 'bullet', text: 'Recording of Music: Licensee may incorporate the Beat into their sound recordings.' },
    { kind: 'bullet', text: 'Distribution: Licensee may distribute and sell the sound recordings via digital platforms such as streaming services, digital downloads, and physical media.' },
    { kind: 'paragraph', text: '1.2 Limitations:' },
    { kind: 'bullet', text: 'This license does not include the right to use the Beat in any audiovisual works (including film, TV, video games, or commercials), which would require a separate sync license.' },
    { kind: 'bullet', text: 'The total number of streams of the sound recording incorporating the Beat shall not exceed 100,000 streams.' },
    { kind: 'bullet', text: 'The license grants limited performance rights only for non-commercial purposes. Licensee may perform the sound recording for live performances, but cannot charge an entry fee or receive compensation directly from the performance of the sound recording without prior written approval from Licensor.' },

    { kind: 'heading', text: '2. Description of the Beat' },
    { kind: 'paragraph', text: '2.1 The Beat provided under this Agreement is described as follows:' },
    { kind: 'bullet', text: `Beat Title: ${trackTitle}` },
    { kind: 'bullet', text: `File Format: ${fileFormat}` },
    { kind: 'bullet', text: 'Tempo: N/A' },
    { kind: 'bullet', text: 'Key: N/A' },
    { kind: 'bullet', text: 'Duration: N/A' },
    { kind: 'paragraph', text: 'The Beat is delivered via secure digital download.' },

    { kind: 'heading', text: '3. Compensation' },
    { kind: 'paragraph', text: `3.1 Lease Fee: In exchange for the rights granted under this Agreement, Licensee shall pay Licensor a one-time non-refundable fee of ${priceStr} ("Lease Fee"). This payment must be made prior to the delivery of the Beat.` },
    { kind: 'paragraph', text: '3.2 Royalties and Revenue: Licensee acknowledges and agrees that Licensor is entitled to receive royalties from any income generated by the use of the Beat, including but not limited to sales, streaming, or licensing of the sound recording. Licensee retains all income and royalties from the exploitation of the sound recording.' },

    { kind: 'heading', text: '4. Restrictions' },
    { kind: 'paragraph', text: '4.1 No Sync License: Licensee may not use the Beat in any audiovisual works, including but not limited to film, television, commercials, video games, or other media requiring synchronization of music with visuals, unless a separate sync license is negotiated with Licensor.' },
    { kind: 'paragraph', text: '4.2 Limited Stream Cap: Licensee is granted the right to stream the sound recording incorporating the Beat, but the total number of streams across all platforms may not exceed 100,000 streams. If this cap is exceeded, Licensee must negotiate a new license or pay additional fees to Licensor.' },
    { kind: 'paragraph', text: '4.3 Limited Performance Rights: Licensee is granted limited performance rights for live performances, but these performances must be non-commercial. Licensee may not perform the sound recording for profit without obtaining a separate agreement or permission from Licensor.' },
    { kind: 'paragraph', text: '4.4 No Transfer or Sub-Licensing: Licensee may not assign, transfer, or sublicense any of the rights granted under this Agreement to any third party without prior written consent from Licensor.' },
    { kind: 'paragraph', text: '4.5 No Modification: Licensee may not alter, remix, or edit the Beat in any way that changes its original composition or structure unless written permission is obtained from Licensor.' },

    { kind: 'heading', text: '5. Ownership and Credit' },
    { kind: 'paragraph', text: '5.1 Ownership of Beat: Licensor retains full ownership of the Beat and all underlying compositions and recordings. This Agreement grants only a limited license to use the Beat as outlined herein.' },
    { kind: 'paragraph', text: '5.2 Credit: Licensee agrees to provide proper credit to Licensor in connection with the use of the Beat. Credit should be given in the form of "Produced by T. Hendo" on the artwork, album credits, or other promotional materials related to the sound recording.' },

    { kind: 'heading', text: '6. Term and Termination' },
    { kind: 'paragraph', text: '6.1 Term: This license is granted for a perpetual term, beginning on the Effective Date of this Agreement.' },
    { kind: 'paragraph', text: '6.2 Termination for Breach: Licensor may terminate this Agreement immediately upon written notice if the other party materially breaches any term of this Agreement and fails to remedy such breach within 30 days after receiving notice of such breach.' },
    { kind: 'paragraph', text: '6.3 Termination Rights: Upon termination of this Agreement, Licensee must immediately cease using the Beat in any new projects, distributions, or performances. However, any previously distributed sound recordings may remain in circulation and on digital platforms, subject to the terms of this Agreement.' },

    { kind: 'heading', text: '7. Warranties and Representations' },
    { kind: 'paragraph', text: '7.1 Licensor’s Warranties: Licensor represents and warrants that:' },
    { kind: 'bullet', text: 'Licensor is the sole owner of the Beat and has the full right to grant the license specified in this Agreement.' },
    { kind: 'bullet', text: 'The use of the Beat as authorized by this Agreement does not infringe upon any third-party rights.' },
    { kind: 'paragraph', text: '7.2 Licensee’s Warranties: Licensee represents and warrants that:' },
    { kind: 'bullet', text: 'Licensee has the full right and authority to enter into this Agreement and perform their obligations hereunder.' },
    { kind: 'bullet', text: 'Licensee’s use of the Beat will not infringe upon the rights of any third party.' },

    { kind: 'heading', text: '8. Indemnity' },
    { kind: 'paragraph', text: 'Licensee agrees to indemnify, defend, and hold harmless Licensor from any claims, damages, losses, or expenses (including legal fees) arising out of Licensee’s breach of this Agreement or any unauthorized use of the Beat.' },

    { kind: 'heading', text: '9. Miscellaneous' },
    { kind: 'paragraph', text: '9.1 Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the state of Wyoming, without regard to its conflict of laws principles.' },
    { kind: 'paragraph', text: '9.2 Entire Agreement: This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements or understandings, whether written or oral, relating to the Beat.' },
    { kind: 'paragraph', text: '9.3 Amendment: Any amendments or modifications to this Agreement must be made in writing and signed by both parties.' },
    { kind: 'paragraph', text: '9.4 Severability: If any provision of this Agreement is found to be invalid or unenforceable, the remainder of the Agreement shall remain in full force and effect.' },

    { kind: 'space', size: 4 },
    { kind: 'paragraph', text: 'IN WITNESS WHEREOF, the parties hereto have executed this Beat Lease License Agreement as of the Effective Date.' },

    { kind: 'heading', text: 'Licensor:' },
    { kind: 'paragraph', text: 'Signature: T. Hendo' },
    { kind: 'paragraph', text: 'Name: T. Hendo' },
    { kind: 'paragraph', text: `Date: ${dateStr}` },

    { kind: 'heading', text: 'Licensee:' },
    { kind: 'paragraph', text: 'Signature: ______________________________' },
    { kind: 'paragraph', text: `Name: ${licensee}` },
    { kind: 'paragraph', text: `Date: ${dateStr}` },

    { kind: 'space', size: 4 },
    { kind: 'paragraph', text: 'This agreement constitutes a binding license accepted by the Licensee upon purchase, download, or use of the Beat.' },
  ];
}

/**
 * Renders the autofilled long-form Beat Lease Agreement to a PDF buffer,
 * handling multi-page flow automatically.
 */
async function generateRightsPDF(
  trackTitle: string,
  userName: string,
  userEmail: string,
  purchaseDate: Date,
  price: number,
  fileFormat: string
): Promise<Buffer> {
  try {
    const doc = new jsPDF(); // mm units, A4 portrait
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const marginTop = 20;
    const marginBottom = 20;
    const maxWidth = pageWidth - marginX * 2;
    const bulletIndent = 6;

    let y = marginTop;

    const ensureSpace = (lineHeight: number) => {
      if (y + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        y = marginTop;
      }
    };

    const writeWrapped = (
      text: string,
      lineHeight: number,
      x: number,
      width: number
    ) => {
      const lines = doc.splitTextToSize(text, width) as string[];
      for (const line of lines) {
        ensureSpace(lineHeight);
        doc.text(line, x, y);
        y += lineHeight;
      }
    };

    const blocks = buildBeatLeaseBlocks(
      trackTitle,
      userName,
      userEmail,
      purchaseDate,
      price,
      fileFormat
    );

    for (const block of blocks) {
      switch (block.kind) {
        case 'title':
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);
          ensureSpace(10);
          doc.text(block.text, pageWidth / 2, y, { align: 'center' });
          y += 12;
          break;
        case 'subtitle':
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          writeWrapped(block.text, 6, marginX, maxWidth);
          y += 2;
          break;
        case 'heading':
          y += 3;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          writeWrapped(block.text, 6, marginX, maxWidth);
          y += 1;
          break;
        case 'paragraph':
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          writeWrapped(block.text, 5.5, marginX, maxWidth);
          y += 2.5;
          break;
        case 'bullet':
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          ensureSpace(5.5);
          doc.text('•', marginX, y);
          writeWrapped(block.text, 5.5, marginX + bulletIndent, maxWidth - bulletIndent);
          y += 1.5;
          break;
        case 'space':
          y += block.size ?? 4;
          break;
      }
    }

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

/**
 * Generates download package (ZIP + PDF) and uploads to Firebase Storage
 */
export async function generateDownloadPackage(
  trackId: string,
  userId: string,
  userName: string,
  userEmail: string
): Promise<DownloadPackage> {
  try {
    // Get track information
    const track = await getMusicTrackServer(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const purchaseDate = new Date();
    const timestamp = Date.now();
    
    // Generate PDF first (needed for ZIP)
    const pdfBuffer = await generateRightsPDF(
      track.title,
      userName,
      userEmail,
      purchaseDate,
      track.price,
      inferExtensionFromUrl(track.audioFileUrl).toUpperCase()
    );

    // Generate ZIP file (includes both audio and PDF)
    const zipBuffer = await generateZipFile(track.audioFileUrl, track.title, pdfBuffer);

    // Upload ZIP to Firebase Storage using Admin SDK (bypasses security rules for upload)
    const zipFileName = `purchases/${userId}/${timestamp}_${track.id}.zip`;
    // Get storage bucket name from environment variable
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error('Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your environment variables.');
    }
    const bucket = firebaseAdmin.storage().bucket(storageBucket);
    const zipFile = bucket.file(zipFileName);
    await zipFile.save(zipBuffer, {
      contentType: 'application/zip',
      metadata: {
        contentType: 'application/zip',
      },
    });
    // Generate signed URL that works with security rules (client will authenticate)
    // The file remains private, but authenticated users can access via their client SDK
    const [zipUrl] = await zipFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Upload PDF to Firebase Storage using Admin SDK
    const pdfFileName = `purchases/${userId}/${timestamp}_${track.id}_rights.pdf`;
    const pdfFile = bucket.file(pdfFileName);
    await pdfFile.save(pdfBuffer, {
      contentType: 'application/pdf',
      metadata: {
        contentType: 'application/pdf',
      },
    });
    // Generate signed URL that works with security rules
    const [pdfUrl] = await pdfFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      zipUrl,
      pdfUrl,
      expiresAt
    };
  } catch (error) {
    console.error('Error generating download package:', error);
    throw new Error(`Failed to generate download package: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates ONE ZIP file for a single or multi-track purchase.
 *
 * ZIP structure:
 *  Hendo-Beats-Collection/
 *    <Track Title 1>/
 *      <Track Title 1>.<ext>
 *      <Track Title 1>_Rights.pdf
 *    <Track Title 2>/
 *      ...
 */
export async function generateCollectionDownloadPackage(
  trackIds: string[],
  userId: string,
  userName: string,
  userEmail: string
): Promise<CollectionDownloadPackage> {
  try {
    const cleanedIds = Array.from(new Set(trackIds))
      .filter((id) => typeof id === 'string' && id.trim().length > 0);

    if (cleanedIds.length === 0) {
      throw new Error('No track IDs provided');
    }

    // Get storage bucket name from environment variable
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error('Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your environment variables.');
    }

    const purchaseDate = new Date();
    const timestamp = Date.now();
    const zip = new JSZip();

    const rootFolderName = 'Hendo-Beats-Collection';
    const root = zip.folder(rootFolderName);
    if (!root) {
      throw new Error('Failed to create zip root folder');
    }

    const items: Array<{ trackId: string; trackTitle: string; price: number }> = [];

    for (const trackId of cleanedIds) {
      const track = await getMusicTrackServer(trackId);
      if (!track) {
        throw new Error(`Track not found: ${trackId}`);
      }

      const trackFolderName = sanitizeFolderName(track.title);
      const trackFolder = root.folder(trackFolderName);
      if (!trackFolder) {
        throw new Error(`Failed to create folder for track: ${track.title}`);
      }

      const ext = inferExtensionFromUrl(track.audioFileUrl);

      // Generate the autofilled Beat Lease Agreement (price = this track's price)
      const pdfBuffer = await generateRightsPDF(
        track.title,
        userName,
        userEmail,
        purchaseDate,
        track.price,
        ext.toUpperCase()
      );

      // Download audio
      const audioResponse = await fetch(track.audioFileUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
      }
      const audioBlob = await audioResponse.blob();
      const audioArrayBuffer = await audioBlob.arrayBuffer();

      const sanitizedTitle = trackFolderName.replace(/[^a-z0-9 ]/gi, '_').replace(/\s+/g, '_');
      const audioFileName = `${sanitizedTitle}.${ext}`;
      const pdfFileName = `${sanitizedTitle}_Beat_Lease_Agreement.pdf`;

      trackFolder.file(audioFileName, audioArrayBuffer);
      trackFolder.file(pdfFileName, pdfBuffer);

      items.push({ trackId: track.id, trackTitle: track.title, price: track.price });
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Upload ZIP to Firebase Storage using Admin SDK
    const zipFileName = `purchases/${userId}/${timestamp}_${rootFolderName}.zip`;
    const bucket = firebaseAdmin.storage().bucket(storageBucket);
    const zipFile = bucket.file(zipFileName);

    await zipFile.save(zipBuffer, {
      contentType: 'application/zip',
      metadata: {
        contentType: 'application/zip',
      },
    });

    const [zipUrl] = await zipFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return { zipUrl, expiresAt, items };
  } catch (error) {
    console.error('Error generating collection download package:', error);
    throw new Error(`Failed to generate collection download package: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

