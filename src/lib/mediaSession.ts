// Media Session metadata for lock screens, CarPlay and Bluetooth car displays.
//
// Without this, iOS reports the page <title> as the track name (e.g.
// "T.Hendo - Home") and renders the favicon on a white square as artwork.
// The client wants the display to always read "T.HENDO-DREAMSTATION", with
// the transparent star as artwork.

const DISPLAY_TITLE = 'T.HENDO-DREAMSTATION';

/**
 * Call whenever a track starts playing. The track title lands in the album
 * slot so car displays still show which beat is playing on the smaller line.
 */
export function setNowPlayingMetadata(trackTitle?: string) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: DISPLAY_TITLE,
    artist: 'T.HENDO',
    album: trackTitle ?? '',
    artwork: [
      { src: '/media-artwork.png', sizes: '512x512', type: 'image/png' },
    ],
  });
}
