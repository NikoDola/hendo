// Download generation utilities for purchased music tracks
import JSZip from 'jszip';
import { getMusicTrack } from './music';
import pdfMake from 'pdfmake/build/pdfmake';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

// Initialize pdfMake fonts (lazy initialization inside function to avoid module loading issues)
async function initializePdfMakeFonts() {
  if (!pdfMake.vfs || Object.keys(pdfMake.vfs).length === 0) {
    try {
      const pdfFonts = await import('pdfmake/build/vfs_fonts');
      const fontsModule = pdfFonts as { default?: { vfs?: Record<string, string> }; pdfMake?: { vfs?: Record<string, string> } };
      pdfMake.vfs = fontsModule.default?.vfs || fontsModule.pdfMake?.vfs || {};
    } catch (error: unknown) {
      console.error('Failed to load pdfmake fonts:', error);
      // Create empty vfs as fallback (will use default fonts)
      pdfMake.vfs = {};
    }
  }
}

interface DownloadPackage {
  zipUrl: string;
  pdfUrl: string;
  expiresAt: Date;
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
    const pdfFileName = `${sanitizedTitle}_Rights.pdf`;
    zip.file(pdfFileName, pdfBuffer);
    
    // Generate ZIP as buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return zipBuffer;
  } catch (error) {
    console.error('Error generating ZIP file:', error);
    throw new Error('Failed to generate ZIP file');
  }
}

/**
 * Generates a PDF document with music rights information
 */
async function generateRightsPDF(
  trackTitle: string,
  userName: string,
  userEmail: string,
  purchaseDate: Date
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Initialize fonts before creating PDF
      initializePdfMakeFonts();
      
      const docDefinition = {
        pageMargins: [50, 50, 50, 50],
        content: [
          {
            text: 'Music Rights License',
            fontSize: 24,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: `Date: ${purchaseDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}`,
            fontSize: 12,
            margin: [0, 0, 0, 10]
          },
          {
            text: `Track: ${trackTitle}`,
            fontSize: 12,
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Licensed To:',
            fontSize: 12,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          {
            text: `Name: ${userName}`,
            fontSize: 12,
            margin: [0, 0, 0, 5]
          },
          {
            text: `Email: ${userEmail}`,
            fontSize: 12,
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Client: T.Hendo',
            fontSize: 12,
            margin: [0, 0, 0, 20]
          },
          {
            text: 'License Terms',
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 10]
          },
          {
            text: 'This license grants the purchaser the right to use this music track in accordance with the terms of purchase. All rights are reserved by T.Hendo.',
            fontSize: 10,
            margin: [0, 0, 0, 10],
            lineHeight: 1.5
          },
          {
            text: 'For questions regarding this license, please contact T.Hendo.',
            fontSize: 10,
            margin: [0, 0, 0, 20]
          }
        ]
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    } catch (error) {
      reject(error);
    }
  });
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
    const track = await getMusicTrack(trackId);
    if (!track) {
      throw new Error('Track not found');
    }

    const purchaseDate = new Date();
    const timestamp = Date.now();
    
    // Generate PDF first (needed for ZIP)
    console.log('Generating PDF...');
    const pdfBuffer = await generateRightsPDF(
      track.title,
      userName,
      userEmail,
      purchaseDate
    );
    
    // Generate ZIP file (includes both audio and PDF)
    console.log('Generating ZIP file...');
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
    console.log('ZIP uploaded:', zipUrl);

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
    console.log('PDF uploaded:', pdfUrl);

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

