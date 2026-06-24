// Tiny global signal for "is a track currently playing", used to gate the
// site-wide theme color cycle. The cycle (and its Safari memory cost) only runs
// while music plays — idle pages stay static, so the leak never accumulates.
//
// Each music list reports its own playing state via setMusicPlaying(); the
// ColorToggleProvider subscribes. Kept deliberately dependency-free (no React)
// so any component or the theme driver can use it.

let playing = false;
const listeners = new Set<(p: boolean) => void>();

export function setMusicPlaying(next: boolean) {
  if (next === playing) return;
  playing = next;
  listeners.forEach((l) => l(playing));
}

export function getMusicPlaying() {
  return playing;
}

export function subscribeMusicPlaying(listener: (p: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
