import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromSession } from '@/lib/admin-auth';
import { updateMusicTrack, deleteMusicTrack, getMusicTrack } from '@/lib/music';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const track = await getMusicTrack(params.id);
    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ track });

  } catch (error) {
    console.error('Get music track error:', error);
    return NextResponse.json(
      { error: 'Failed to get music track' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const updateData: any = {};

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const hashtagsString = formData.get('hashtags') as string;
    const price = formData.get('price') as string;
    const audioFile = formData.get('audioFile') as File | null;
    const pdfFile = formData.get('pdfFile') as File | null;

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (hashtagsString) {
      updateData.hashtags = hashtagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    if (price) updateData.price = parseFloat(price);
    if (audioFile && audioFile.size > 0) updateData.audioFile = audioFile;
    if (pdfFile && pdfFile.size > 0) updateData.pdfFile = pdfFile;

    const track = await updateMusicTrack(params.id, updateData, admin.email);
    return NextResponse.json({ track });

  } catch (error) {
    console.error('Update music track error:', error);
    return NextResponse.json(
      { error: 'Failed to update music track' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromSession();
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await deleteMusicTrack(params.id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete music track error:', error);
    return NextResponse.json(
      { error: 'Failed to delete music track' },
      { status: 500 }
    );
  }
}
