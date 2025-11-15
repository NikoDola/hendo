import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { getAllMusicTracks } from '@/lib/music';

export async function GET() {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tracks = await getAllMusicTracks();
    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('Get music tracks error:', error);
    return NextResponse.json(
      { error: 'Failed to get music tracks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in as an admin to create tracks.' },
        { status: 401 }
      );
    }

    // Files are now uploaded client-side, so we receive JSON with file URLs
    let body;
    try {
      // Read body as text first to see what we're actually getting
      const bodyText = await request.text();
      console.log('Raw request body (first 500 chars):', bodyText?.substring(0, 500));
      console.log('Body length:', bodyText?.length);
      console.log('Body starts with:', bodyText?.substring(0, 10));
      
      if (!bodyText || bodyText.trim().length === 0) {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      
      // Try to parse the trimmed body
      const trimmedBody = bodyText.trim();
      body = JSON.parse(trimmedBody);
      console.log('Successfully parsed body:', JSON.stringify(body, null, 2));
    } catch (jsonError: unknown) {
      const error = jsonError as Error & { name?: string };
      console.error('Failed to parse JSON:', jsonError);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        position: error.message?.match(/position (\d+)/)?.[1]
      });
      
      return NextResponse.json(
        { 
          error: `Invalid request format. The request body is not valid JSON. Please check that all fields are filled correctly.` 
        },
        { status: 400 }
      );
    }

    const { title, description, hashtags, genre, price, audioFileUrl, audioFileName, pdfFileUrl, pdfFileName, imageFileUrl, imageFileName, showToHome } = body;

    // Validation
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    if (!audioFileUrl || !audioFileName) {
      return NextResponse.json(
        { error: 'Audio file URL is required. Please ensure the file was uploaded successfully.' },
        { status: 400 }
      );
    }
    if (!price || isNaN(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Price must be a valid number greater than 0' },
        { status: 400 }
      );
    }

    // Create track in Firestore with file URLs
    try {
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      const musicRef = await addDoc(collection(db, 'music'), {
        title: title.trim(),
        description: description.trim(),
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        genre: genre ? genre.trim() : '',
        price: parseFloat(price),
        audioFileUrl,
        audioFileName,
        pdfFileUrl: pdfFileUrl || null,
        pdfFileName: pdfFileName || null,
        imageFileUrl: imageFileUrl || null,
        imageFileName: imageFileName || null,
        showToHome: showToHome || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: admin.email
      });

      const track = {
        id: musicRef.id,
        title: title.trim(),
        description: description.trim(),
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        genre: genre ? genre.trim() : '',
        price: parseFloat(price),
        audioFileUrl,
        audioFileName,
        pdfFileUrl: pdfFileUrl || undefined,
        pdfFileName: pdfFileName || undefined,
        imageFileUrl: imageFileUrl || undefined,
        imageFileName: imageFileName || undefined,
        showToHome: showToHome || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: admin.email
      };

      return NextResponse.json({ track });
    } catch (createError: unknown) {
      const error = createError as Error;
      console.error('Create music track error:', createError);
      const errorMessage = error.message || 'Unknown error occurred';
      
      let statusCode = 500;
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        statusCode = 403;
      } else if (errorMessage.includes('quota')) {
        statusCode = 507;
      }
      
      return NextResponse.json(
        { error: `Failed to save track: ${errorMessage}` },
        { status: statusCode }
      );
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Create music track error:', error);
    return NextResponse.json(
      { error: err.message || 'Failed to create music track. Please try again.' },
      { status: 500 }
    );
  }
}
