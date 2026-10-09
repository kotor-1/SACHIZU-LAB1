/** Spoken words and a short tone for the camera mode: filmed from the side, the athlete faces away from the phone and
 * cannot read the screen mid-set. iOS plays sound and speech only after a tap: `unlock` is called in the tap that
 * starts the camera. */
export class Voice {
  private audio: AudioContext | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  constructor(public speak = true, public tone = true) {}
  unlock() {
    try {
      const A = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (A && !this.audio) this.audio = new A();
      void this.audio?.resume();
    } catch { this.audio = null; }
    if (typeof speechSynthesis !== 'undefined') {
      const pick = () => { this.voice = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').startsWith('ja')) ?? null; };
      pick(); speechSynthesis.addEventListener?.('voiceschanged', pick, { once: true });
      // An empty utterance in the tap lets later ones play (iOS).
      const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u);
    }
  }
  say(text: string) {
    if (!this.speak || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 1.15;
    if (this.voice) u.voice = this.voice;
    speechSynthesis.speak(u);
  }
  /** A short tone (Hz, s). */
  beep(hz = 1320, seconds = .12) {
    const a = this.audio; if (!this.tone || !a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.frequency.value = hz; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.4, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + seconds);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + seconds + .02);
  }
  close() { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); void this.audio?.close().catch(() => undefined); this.audio = null; }
}
