// Media Session metadata for lock screens, CarPlay and Bluetooth car displays.
//
// Without this, iOS reports the page <title> as the track name (e.g.
// "T.Hendo - Home") and renders the favicon on a white square as artwork.
// The client wants the display to always read "T. HENDO-DREAMSTATION"
// (with a space in "T. HENDO" — never "T.HENDO"), with
// the star on a solid black background as artwork. The black must be baked
// into the PNG — iOS fills transparent artwork with white before sending it
// to Bluetooth/CarPlay displays.

const DISPLAY_TITLE = 'T. HENDO-DREAMSTATION';

/**
 * Call whenever a track starts playing. The track title lands in the album
 * slot so car displays still show which beat is playing on the smaller line.
 */
export function setNowPlayingMetadata(trackTitle?: string) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: DISPLAY_TITLE,
    artist: 'T. HENDO',
    album: trackTitle ?? '',
    artwork: [
      // ?v= busts caches on devices that stored the old transparent artwork
      { src: '/media-artwork.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
  });
}
