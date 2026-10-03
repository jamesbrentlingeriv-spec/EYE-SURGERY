// Web Speech API - Ophthalmic Surgical Consultant Text-To-Speech (TTS) Engine

export class SurgicalTtsEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;
  private isAutoNarrateEnabled: boolean = true;
  private speechRate: number = 0.95; // Calm, deliberate surgical speaking rate
  private speechPitch: number = 1.0;
  private speechVolume: number = 1.0;
  private onSpeakingStateChangeListeners: Array<(isSpeaking: boolean) => void> = [];
  public isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    // Prefer high-quality English natural/medical voices
    const preferredVoices = [
      'Google UK English Female',
      'Google US English',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Ryan Online (Natural) - English (United States)',
      'Microsoft David - English (United States)',
      'Microsoft Zira - English (United States)',
      'Samantha',
      'Daniel',
      'Alex'
    ];

    for (const name of preferredVoices) {
      const found = voices.find(v => v.name.includes(name) || v.name === name);
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

    // Fallback to first English voice or first available
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    this.selectedVoice = englishVoice || voices[0];
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public setAutoNarrate(enabled: boolean) {
    this.isAutoNarrateEnabled = enabled;
  }

  public getAutoNarrate(): boolean {
    return this.isAutoNarrateEnabled;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.7, Math.min(1.5, rate));
  }

  public setVolume(volume: number) {
    this.speechVolume = Math.max(0, Math.min(1, volume));
  }

  public subscribe(listener: (isSpeaking: boolean) => void) {
    this.onSpeakingStateChangeListeners.push(listener);
    return () => {
      this.onSpeakingStateChangeListeners = this.onSpeakingStateChangeListeners.filter(l => l !== listener);
    };
  }

  private notify(speaking: boolean) {
    this.isSpeaking = speaking;
    this.onSpeakingStateChangeListeners.forEach(listener => listener(speaking));
  }

  public speak(text: string, force: boolean = false) {
    if (!this.synth) return;
    if (this.isMuted && !force) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;
    utterance.volume = this.speechVolume;

    utterance.onstart = () => {
      this.notify(true);
    };

    utterance.onend = () => {
      this.notify(false);
      this.currentUtterance = null;
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.notify(false);
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.notify(false);
      this.currentUtterance = null;
    }
  }
}

export const ttsEngine = new SurgicalTtsEngine();
