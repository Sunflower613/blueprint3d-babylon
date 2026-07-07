/**
 * Procedural healing melody shared by powered music furniture.
 * The chord progression and note pattern mirror the parent 3D Healing Islands app.
 */
class HealingMusicPlayer {
  constructor() {
    this.owners = new Set();
    this.intervalId = null;
    this.audioContext = null;
    this.activeOscillators = new Set();
    this.chordIndex = 0;
    this.step = 0;
  }

  acquire(ownerId) {
    if (!ownerId || typeof window === 'undefined') return;
    this.owners.add(ownerId);
    if (this.intervalId === null) this.start();
  }

  release(ownerId) {
    if (!ownerId) return;
    this.owners.delete(ownerId);
    if (this.owners.size === 0) this.stop();
  }

  start() {
    if (typeof window === 'undefined' || this.intervalId !== null) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      this.audioContext ||= new AudioContextClass();
      this.resume();
      this.chordIndex = 0;
      this.step = 0;
      this.playStep();
      this.intervalId = window.setInterval(() => this.playStep(), 320);
    } catch (error) {
      console.warn('Unable to start healing music', error);
    }
  }

  resume() {
    if (!this.audioContext || this.audioContext.state !== 'suspended') return;
    this.audioContext.resume().catch(() => {
      const resumeOnGesture = () => {
        this.audioContext?.resume();
        document.removeEventListener('pointerdown', resumeOnGesture);
        document.removeEventListener('keydown', resumeOnGesture);
      };
      document.addEventListener('pointerdown', resumeOnGesture, { once: true });
      document.addEventListener('keydown', resumeOnGesture, { once: true });
    });
  }

  playStep() {
    if (this.owners.size === 0 || !this.audioContext) return;
    const chords = [
      [130.81, 196.00, 261.63, 329.63, 392.00],
      [146.83, 220.00, 293.66, 349.23, 440.00],
      [164.81, 246.94, 329.63, 392.00, 493.88],
      [116.54, 174.61, 233.08, 293.66, 349.23]
    ];
    const pattern = [0, 2, 1, 3, 2, 4, 3, 1];
    const frequency = chords[this.chordIndex][pattern[this.step % pattern.length]];

    this.playNote(frequency, 0.9, 0.08);
    if (this.step % 4 === 0 && Math.random() > 0.3) {
      this.playNote(frequency * 2, 1.6, 0.03);
    }

    this.step += 1;
    if (this.step % 16 === 0) {
      this.chordIndex = (this.chordIndex + 1) % chords.length;
    }
  }

  playNote(frequency, duration, volume) {
    if (!this.audioContext) return;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    this.activeOscillators.add(oscillator);
    oscillator.onended = () => this.activeOscillators.delete(oscillator);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  stop() {
    if (this.intervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeOscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch {}
    });
    this.activeOscillators.clear();
    this.chordIndex = 0;
    this.step = 0;
  }
}

export const healingMusic = new HealingMusicPlayer();

