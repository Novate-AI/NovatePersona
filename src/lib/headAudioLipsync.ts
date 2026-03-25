import { HeadAudio } from "@met4citizen/headaudio/modules/headaudio.mjs";
import { TalkingHead } from "@met4citizen/talkinghead";
import headworkletUrl from "@met4citizen/headaudio/dist/headworklet.min.mjs?url";

/** Pre-trained English viseme model (not shipped in the npm package; load from CDN). */
export const HEADAUDIO_MODEL_URL =
  "https://cdn.jsdelivr.net/gh/met4citizen/HeadAudio@main/dist/model-en-mixed.bin";

const workletAdded = new WeakMap<AudioContext, true>();

/**
 * Wire HeadAudio to the same TalkingHead graph used by speakAudio (README integration).
 * Viseme blend shapes are driven from the actual PCM reaching the speech gain node.
 */
export async function attachHeadAudioToTalkingHead(head: InstanceType<typeof TalkingHead>): Promise<HeadAudio> {
  const ctx = head.audioCtx;

  if (!workletAdded.has(ctx)) {
    await ctx.audioWorklet.addModule(headworkletUrl);
    workletAdded.set(ctx, true);
  }

  const headaudio = new HeadAudio(ctx, {
    processorOptions: {},
    parameterData: {
      vadGateActiveDb: -40,
      vadGateInactiveDb: -60,
    },
  });

  await headaudio.loadModel(HEADAUDIO_MODEL_URL);

  if (!head.audioSpeechGainNode) {
    throw new Error("TalkingHead audioSpeechGainNode not available");
  }

  head.audioSpeechGainNode.connect(headaudio);

  headaudio.onvalue = (key: string, value: number) => {
    const m = head.mtAvatar[key];
    if (m) Object.assign(m, { newvalue: value, needsUpdate: true });
  };

  head.opt.update = (dt: number) => {
    headaudio.update(dt);
  };

  headaudio.start();
  return headaudio;
}

export function detachHeadAudioFromTalkingHead(
  head: InstanceType<typeof TalkingHead>,
  headaudio: HeadAudio | null
): void {
  head.opt.update = null;
  try {
    headaudio?.stop();
    headaudio?.disconnect();
  } catch {
    /* ignore */
  }
}
