import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: purchaseId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'zip' or 'pdf'

    // Get purchase document
    const purchaseDoc = await getDoc(doc(db, 'purchases', purchaseId));
    
    if (!purchaseDoc.exists()) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const purchaseData = purchaseDoc.data();

    // Verify user owns this purchase
    if (purchaseData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the original URL to extract the file path
    let originalUrl: string;
    
    if (type === 'zip') {
      originalUrl = purchaseData.zipUrl;
    } else if (type === 'pdf') {
      originalUrl = purchaseData.pdfUrl;
    } else {
      return NextResponse.json(
        { error: 'Invalid download type' },
        { status: 400 }
      );
    }

    // Extract the file path from the URL
    let filePath: string;
    try {
      const urlObj = new URL(originalUrl);
      
      // Handle different URL formats
      if (urlObj.hostname === 'storage.googleapis.com') {
        // Format: https://storage.googleapis.com/[bucket]/[path]
        const parts = urlObj.pathname.substring(1).split('/');
        parts.shift(); // Remove bucket name
        filePath = parts.join('/');
      } else {
        // Other formats - just remove leading slash
        filePath = urlObj.pathname.substring(1);
      }
      
    } catch (error) {
      console.error('Failed to parse URL:', error);
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 500 }
      );
    }

    // Generate a fresh signed URL using Firebase Admin SDK (has full permissions)
    // This URL will be valid for 7 days
    try {
      const bucket = firebaseAdmin.storage().bucket();
      const file = bucket.file(filePath);
      
      // Create a signed URL that expires in 7 days
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      });
      
      return NextResponse.json({
        downloadUrl: signedUrl,
        expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Download URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

