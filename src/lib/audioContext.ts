// Shared Web Audio context for the whole app.
//
// Safari (especially iOS) caps the number of AudioContext instances per page
// (~4) and aggressively reloads tabs under memory pressure. Creating a new
// AudioContext per MusicCard / song was leaking contexts and crashing Safari
// mid-playback. We use a single shared context and cache the per-element
// source node (createMediaElementSource may only be called once per element).

let sharedContext: AudioContext | null = null;
const sourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

type AudioContextCtor = typeof AudioContext;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedContext) {
    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!Ctor) return null;
    sharedContext = new Ctor();
  }

  return sharedContext;
}

/**
 * Returns the shared context and the (cached) MediaElementAudioSourceNode for
 * the given audio element. Safe to call repeatedly — the source is created at
 * most once per element.
 */
export function getMediaElementSource(
  audio: HTMLMediaElement
): { context: AudioContext; source: MediaElementAudioSourceNode } | null {
  const context = getSharedAudioContext();
  if (!context) return null;

  let source = sourceMap.get(audio);
  if (!source) {
    source = context.createMediaElementSource(audio);
    sourceMap.set(audio, source);
  }

  return { context, source };
}
