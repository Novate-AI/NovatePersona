declare module "@met4citizen/talkinghead/modules/lipsync-en.mjs" {
  export class LipsyncEn {
    constructor();
    preProcessText(s: string): string;
    wordsToVisemes(word: string): { visemes: string[]; times: number[]; durations: number[] };
  }
}

declare module "@met4citizen/talkinghead" {
  export class TalkingHead {
    constructor(node: HTMLElement, opt?: Record<string, unknown>);
    showAvatar(avatar: { url: string; body?: string; avatarMood?: string }, onprogress?: (ev: ProgressEvent) => void): Promise<void>;
    start(): void;
    stop(): void;
    audioCtx: AudioContext;
    audioSpeechGainNode: GainNode;
    audioReverbNode: AudioNode;
    mtAvatar: Record<string, { newvalue: number; needsUpdate: boolean }>;
    opt: { update?: ((dt: number) => void) | null };
    lipsync: Record<string, unknown>;
    lipsyncPreProcessText(s: string, lang: string): string;
    isSpeaking: boolean;
    isAudioPlaying: boolean;
    speechQueue: unknown[];
    audioPlaylist: unknown[];
    speakAudio(
      r: { audio: AudioBuffer; words?: string[]; wtimes?: number[]; wdurations?: number[] },
      opt?: { lipsyncLang?: string } | null,
      onsubtitles?: unknown
    ): void;
    stopSpeaking(): void;
  }
}

declare module "@met4citizen/headaudio/modules/headaudio.mjs" {
  export class HeadAudio extends AudioWorkletNode {
    constructor(audioCtx: AudioContext, options?: Record<string, unknown>);
    loadModel(url: string, reset?: boolean): Promise<void>;
    start(): void;
    stop(): void;
    update(dt: number): void;
    onvalue: ((key: string, value: number) => void) | null;
  }
}
