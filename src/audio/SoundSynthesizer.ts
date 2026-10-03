// Web Audio API Surgical Sound Synthesizer for Anterior Segment Ophthalmic Simulator

export class SurgicalAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  
  // Phaco sound nodes
  private phacoOsc: OscillatorNode | null = null;
  private phacoHarmonicOsc: OscillatorNode | null = null;
  private phacoGain: GainNode | null = null;
  private phacoFilter: BiquadFilterNode | null = null;
  
  // Vacuum pump nodes
  private pumpOsc: OscillatorNode | null = null;
  private pumpGain: GainNode | null = null;
  
  // Fluid irrigation noise node
  private fluidGain: GainNode | null = null;
  private fluidFilter: BiquadFilterNode | null = null;
  
  // Occlusion buzzer
  private occlusionOsc: OscillatorNode | null = null;
  private occlusionGain: GainNode | null = null;
  
  // Master gain
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.isInitialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. Ultrasound Phacoemulsification Generator ---
      this.phacoOsc = this.ctx.createOscillator();
      this.phacoHarmonicOsc = this.ctx.createOscillator();
      this.phacoGain = this.ctx.createGain();
      this.phacoFilter = this.ctx.createBiquadFilter();

      this.phacoOsc.type = 'sawtooth';
      this.phacoOsc.frequency.setValueAtTime(580, this.ctx.currentTime);

      this.phacoHarmonicOsc.type = 'sine';
      this.phacoHarmonicOsc.frequency.setValueAtTime(1160, this.ctx.currentTime);

      this.phacoFilter.type = 'bandpass';
      this.phacoFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.phacoFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.phacoGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.phacoOsc.connect(this.phacoFilter);
      this.phacoHarmonicOsc.connect(this.phacoFilter);
      this.phacoFilter.connect(this.phacoGain);
      this.phacoGain.connect(this.masterGain);

      this.phacoOsc.start();
      this.phacoHarmonicOsc.start();

      // --- 2. Peristaltic / Venturi Vacuum Pump Whine ---
      this.pumpOsc = this.ctx.createOscillator();
      this.pumpGain = this.ctx.createGain();
      this.pumpOsc.type = 'triangle';
      this.pumpOsc.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.pumpGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.pumpOsc.connect(this.pumpGain);
      this.pumpGain.connect(this.masterGain);
      this.pumpOsc.start();

      // --- 3. Fluid Irrigation White Noise Generator ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.fluidFilter = this.ctx.createBiquadFilter();
      this.fluidFilter.type = 'lowpass';
      this.fluidFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      this.fluidGain = this.ctx.createGain();
      this.fluidGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      whiteNoise.connect(this.fluidFilter);
      this.fluidFilter.connect(this.fluidGain);
      this.fluidGain.connect(this.masterGain);
      whiteNoise.start();

      // --- 4. Occlusion Tone ---
      this.occlusionOsc = this.ctx.createOscillator();
      this.occlusionGain = this.ctx.createGain();
      this.occlusionOsc.type = 'square';
      this.occlusionOsc.frequency.setValueAtTime(440, this.ctx.currentTime);
      this.occlusionGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.occlusionOsc.connect(this.occlusionGain);
      this.occlusionGain.connect(this.masterGain);
      this.occlusionOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization deferral:', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public updatePhacoSound(
    pedalPos: number,
    vacuumMmHg: number,
    powerPercent: number,
    isOccluded: boolean,
    isSurge: boolean
  ) {
    if (!this.ctx || !this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Irrigation Sound (Pos 1, 2, 3)
    if (pedalPos >= 1 && this.fluidGain) {
      this.fluidGain.gain.setTargetAtTime(0.08, now, 0.08);
    } else if (this.fluidGain) {
      this.fluidGain.gain.setTargetAtTime(0.0001, now, 0.1);
    }

    // 2. Vacuum Pitch Whine (Pos 2, 3)
    if (pedalPos >= 2 && this.pumpOsc && this.pumpGain) {
      // Frequency ramps up smoothly with vacuum from 180 Hz to 720 Hz
      const vacuumNormalized = Math.min(Math.max(vacuumMmHg / 600, 0), 1);
      const targetFreq = 180 + vacuumNormalized * 560;
      this.pumpOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
      this.pumpGain.gain.setTargetAtTime(0.12 + vacuumNormalized * 0.15, now, 0.05);
    } else if (this.pumpGain) {
      this.pumpGain.gain.setTargetAtTime(0.0001, now, 0.08);
    }

    // 3. Phaco Ultrasound Buzz (Pos 3)
    if (pedalPos === 3 && powerPercent > 0 && this.phacoGain && this.phacoOsc) {
      const powerNorm = powerPercent / 100;
      const targetGain = 0.05 + powerNorm * 0.22;
      this.phacoGain.gain.setTargetAtTime(targetGain, now, 0.04);
      // Slight pitch wobble for realistic transducer load
      const jitter = (Math.random() - 0.5) * 20;
      this.phacoOsc.frequency.setTargetAtTime(620 + powerNorm * 80 + jitter, now, 0.02);
    } else if (this.phacoGain) {
      this.phacoGain.gain.setTargetAtTime(0.0001, now, 0.06);
    }

    // 4. Occlusion Alert Tone
    if (isOccluded && this.occlusionGain) {
      this.occlusionGain.gain.setTargetAtTime(0.15, now, 0.05);
    } else if (this.occlusionGain) {
      this.occlusionGain.gain.setTargetAtTime(0.0001, now, 0.05);
    }

    // 5. Surge Warning Acoustic Beep
    if (isSurge) {
      this.triggerSurgeWarning();
    }
  }

  // Play realistic Nd:YAG Laser Optical Breakdown Cavitation "SNAP"
  public playYagDischarge(energyMj: number, pulseCount: number = 1) {
    if (!this.ctx || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    for (let p = 0; p < pulseCount; p++) {
      const pulseDelay = p * 0.035; // 35 ms pulse interval for double/triple bursts
      const triggerTime = now + pulseDelay;

      // Primary shockwave acoustic impulse (hyper-fast transient snap)
      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      const snapFilter = this.ctx.createBiquadFilter();

      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(2400, triggerTime);
      snapOsc.frequency.exponentialRampToValueAtTime(120, triggerTime + 0.025);

      snapFilter.type = 'highpass';
      snapFilter.frequency.setValueAtTime(600, triggerTime);

      const amp = Math.min(0.3 + (energyMj / 2.5) * 0.4, 0.7);
      snapGain.gain.setValueAtTime(amp, triggerTime);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 0.045);

      snapOsc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(this.masterGain!);

      snapOsc.start(triggerTime);
      snapOsc.stop(triggerTime + 0.05);

      // Cavitation bubble collapse secondary click
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(450, triggerTime + 0.012);
      popOsc.frequency.exponentialRampToValueAtTime(80, triggerTime + 0.035);

      popGain.gain.setValueAtTime(amp * 0.6, triggerTime + 0.012);
      popGain.gain.exponentialRampToValueAtTime(0.0001, triggerTime + 0.04);

      popOsc.connect(popGain);
      popGain.connect(this.masterGain!);

      popOsc.start(triggerTime + 0.012);
      popOsc.stop(triggerTime + 0.045);
    }
  }

  // Play capacitor charge whine for laser recharge
  public playLaserCharge() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Surgeon foot pedal detent click
  public playPedalClick(position: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(position === 0 ? 300 : 500 + position * 150, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Monitor ECG telemetry beep
  public playTelemetryHeartbeat(alert: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(alert ? 880 : 660, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  private triggerSurgeWarning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.linearRampToValueAtTime(750, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Metal instrument collision warning with corneal endothelium or posterior capsule
  public playCollisionAlert() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1046, now); // C6 alert

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const audioEngine = new SurgicalAudioEngine();
