/**
 * Sacred Web Audio Polyphonic Synthesizer for Christian FM Radio Broadcast
 * Ensures reliable, peaceful Christian hymn/worship audio playback across all browsers
 * with real volume control and zero broken external audio streams.
 */

type MelodyPreset = 'hymn_grace' | 'worship_peace' | 'morning_psalm' | 'himalayan_choral';

const PRESET_CHORDS: Record<MelodyPreset, number[][]> = {
  // Amazing Grace / Nepali Bhajan Pentatonic & Major harmonies
  hymn_grace: [
    [261.63, 329.63, 392.0, 523.25], // C major
    [349.23, 440.0, 523.25, 698.46], // F major
    [261.63, 329.63, 392.0, 659.25], // C major high
    [392.0, 493.88, 587.33, 783.99], // G major
  ],
  worship_peace: [
    [293.66, 369.99, 440.0, 587.33], // D major
    [246.94, 329.63, 392.0, 493.88], // E minor7
    [392.0, 493.88, 587.33, 783.99], // G major
    [220.0, 277.18, 329.63, 440.0],  // A major
  ],
  morning_psalm: [
    [349.23, 440.0, 523.25, 659.25], // F maj7
    [293.66, 349.23, 440.0, 587.33], // D min7
    [233.08, 293.66, 349.23, 466.16], // Bb maj
    [261.63, 329.63, 392.0, 523.25], // C major
  ],
  himalayan_choral: [
    [261.63, 392.0, 440.0, 587.33],  // Himalayan open fifth + sixth
    [293.66, 440.0, 523.25, 659.25],
    [329.63, 392.0, 523.25, 783.99],
    [261.63, 329.63, 392.0, 523.25],
  ],
};

class SacredRadioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private isPlaying = false;
  private currentPreset: MelodyPreset = 'hymn_grace';
  private step = 0;
  private volume = 0.7;

  public start(preset: MelodyPreset, volume = 0.7) {
    this.stop();
    this.currentPreset = preset;
    this.volume = volume;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume * 0.25, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.isPlaying = true;
    this.step = 0;
    this.playStep();

    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) {
        this.playStep();
      }
    }, 2400);
  }

  private playStep() {
    if (!this.ctx || !this.masterGain) return;
    const chords = PRESET_CHORDS[this.currentPreset] || PRESET_CHORDS.hymn_grace;
    const chord = chords[this.step % chords.length];
    this.step += 1;

    const now = this.ctx.currentTime;
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = idx === 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(idx === 3 ? 0.22 : 0.14, now + 0.45 + idx * 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.35);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now + idx * 0.1);
      osc.stop(now + 2.4);
    });
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.25, this.ctx.currentTime, 0.08);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // ignore
      }
      this.masterGain = null;
    }
  }
}

export const sacredRadioEngine = new SacredRadioAudioEngine();
