import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { getAllMusicTracks, createMusicTrack } from '@/lib/music';

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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const hashtagsString = formData.get('hashtags') as string;
    const price = parseFloat(formData.get('price') as string);
    const audioFile = formData.get('audioFile') as File;
    const pdfFile = formData.get('pdfFile') as File | null;

    if (!title || !description || !hashtagsString || !price || !audioFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const hashtags = hashtagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    const track = await createMusicTrack({
      title,
      description,
      hashtags,
      price,
      audioFile,
      pdfFile: pdfFile && pdfFile.size > 0 ? pdfFile : undefined
    }, admin.email);

    return NextResponse.json({ track });

  } catch (error) {
    console.error('Create music track error:', error);
    return NextResponse.json(
      { error: 'Failed to create music track' },
      { status: 500 }
    );
  }
}
