// Ophthalmic Surgical Consultant Voiceover Engine
// Hybrid Architecture: Plays Microsoft Neural TTS Studio Audio (edge-tts MP3s) with Web Speech API fallback

export const STEP_VOICEOVER_MAP: Record<string, string> = {
  // Cataract / IOL (1-12)
  paracentesis: 'cataract_01_paracentesis.mp3',
  clear_corneal_incision: 'cataract_02_clear_corneal_incision.mp3',
  ovd_injection: 'cataract_03_ovd_injection.mp3',
  capsulorhexis: 'cataract_04_capsulorhexis.mp3',
  hydrodissection: 'cataract_05_hydrodissection.mp3',
  phaco_chop: 'cataract_06_phaco_chop.mp3',
  cortex_removal: 'cataract_07_cortex_removal.mp3',
  ovd_bag_refill: 'cataract_08_ovd_bag_refill.mp3',
  cartridge_insertion: 'cataract_09_cartridge_insertion.mp3',
  haptic_unfolding: 'cataract_10_haptic_unfolding.mp3',
  sinskey_dialing: 'cataract_11_sinskey_dialing.mp3',
  viscoelastic_washout: 'cataract_12_viscoelastic_washout.mp3',

  // Nd:YAG Laser (1-5)
  contact_lens_placement: 'yag_01_contact_lens_placement.mp3',
  aiming_focus: 'yag_02_aiming_focus.mp3',
  offset_adjustment: 'yag_03_offset_adjustment.mp3',
  cruciate_capsulotomy: 'yag_04_cruciate_capsulotomy.mp3',
  post_yag_assessment: 'yag_05_post_yag_assessment.mp3',

  // MIGS Glaucoma Stent (1-6)
  microscope_and_head_tilt: 'migs_01_microscope_and_head_tilt.mp3',
  gonioprism_placement: 'migs_02_gonioprism_placement.mp3',
  viscoelastic_angle_deepening: 'migs_03_viscoelastic_angle_deepening.mp3',
  stent_1_deployment: 'migs_04_stent_1_deployment.mp3',
  stent_2_deployment: 'migs_05_stent_2_deployment.mp3',
  blood_reflux_and_washout: 'migs_06_blood_reflux_and_washout.mp3'
};

export class SurgicalTtsEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
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
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Jenny (Natural)',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Christopher Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Google UK English Female',
      'Google US English',
      'Samantha',
      'Daniel'
    ];

    for (const name of preferredVoices) {
      const found = voices.find(v => v.name.includes(name) || v.name === name);
      if (found) {
        this.selectedVoice = found;
        return;
      }
    }

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
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.speechRate;
    }
  }

  public setVolume(volume: number) {
    this.speechVolume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.speechVolume;
    }
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

  /**
   * Speak instruction:
   * First attempts to play high-fidelity Microsoft Neural TTS MP3 audio from public/audio/voiceover/.
   * If the file cannot be loaded or played, gracefully falls back to browser SpeechSynthesis.
   */
  public speak(text: string, force: boolean = false, stepId?: string) {
    if (this.isMuted && !force) return;

    // Stop any active speech or audio
    this.stop();

    const audioFile = stepId ? STEP_VOICEOVER_MAP[stepId] : null;

    if (audioFile) {
      // Determine audio base path (supporting both local dev & GitHub Pages subpaths)
      const getAssetPath = (relativePath: string) => {
        if (typeof window === 'undefined') return relativePath;
        const base = window.location.pathname.endsWith('/')
          ? window.location.pathname
          : window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        return `${base}${relativePath.replace(/^\.?\//, '')}`;
      };
      const audioUrl = getAssetPath(`audio/voiceover/${audioFile}`);
      const audio = new Audio(audioUrl);
      audio.volume = this.speechVolume;
      audio.playbackRate = this.speechRate;

      let playedSuccessfully = false;

      audio.onplay = () => {
        playedSuccessfully = true;
        this.notify(true);
      };

      audio.onended = () => {
        this.notify(false);
        this.currentAudio = null;
      };

      audio.onerror = () => {
        if (!playedSuccessfully) {
          console.warn(`[Audio] Neural voiceover not found for ${stepId} (${audioUrl}), falling back to SpeechSynthesis.`);
          this.currentAudio = null;
          this.speakWithSynth(text, force);
        } else {
          this.notify(false);
          this.currentAudio = null;
        }
      };

      this.currentAudio = audio;
      audio.play().catch((err) => {
        console.warn(`[Audio] Audio play failed for ${stepId}:`, err);
        this.currentAudio = null;
        this.speakWithSynth(text, force);
      });
      return;
    }

    // Default fallback to browser speech synthesis
    this.speakWithSynth(text, force);
  }

  private speakWithSynth(text: string, force: boolean = false) {
    if (!this.synth) return;
    if (this.isMuted && !force) return;

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
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudio = null;
    }

    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }

    this.notify(false);
  }
}

export const ttsEngine = new SurgicalTtsEngine();
