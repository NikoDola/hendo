import { NextResponse } from 'next/server';
import { getAllMusicTracks } from '@/lib/music';

export async function GET() {
  try {
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
