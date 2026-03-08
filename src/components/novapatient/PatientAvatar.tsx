interface PatientAvatarProps {
  gender: "Male" | "Female";
  size?: number;
  className?: string;
  /** Unique seed for deterministic realistic avatar (e.g. scenarioCode-patientName). When provided, uses photo; otherwise falls back to SVG. */
  seed?: string;
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % 100;
}

export default function PatientAvatar({ gender, size = 120, className = "", seed }: PatientAvatarProps) {
  const isMale = gender === "Male";

  if (seed) {
    const id = hashSeed(seed);
    const path = isMale ? "men" : "women";
    const src = `https://randomuser.me/api/portraits/med/${path}/${id}.jpg`;
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="60" cy="60" r="58" className="fill-emerald-50 dark:fill-emerald-900/30" />

      {/* Neck */}
      <rect x="48" y="70" width="24" height="14" rx="4" className="fill-amber-200 dark:fill-amber-700" />

      {/* Shoulders / Gown */}
      <path
        d="M30 100 C30 86 42 80 60 80 C78 80 90 86 90 100 L90 120 L30 120 Z"
        className={isMale ? "fill-sky-400 dark:fill-sky-600" : "fill-rose-400 dark:fill-rose-600"}
      />
      {/* Gown neckline */}
      <path
        d="M48 80 L54 90 L60 84 L66 90 L72 80"
        strokeWidth="2"
        className="stroke-white/60"
        fill="none"
      />

      {/* Head */}
      <ellipse cx="60" cy="48" rx="22" ry="26" className="fill-amber-200 dark:fill-amber-700" />

      {/* Hair */}
      {isMale ? (
        <path
          d="M38 42 C38 28 48 20 60 20 C72 20 82 28 82 42 C82 38 78 30 60 30 C42 30 38 38 38 42Z"
          className="fill-amber-900 dark:fill-amber-950"
        />
      ) : (
        <>
          <path
            d="M36 48 C36 24 46 18 60 18 C74 18 84 24 84 48 C84 40 78 28 60 28 C42 28 36 40 36 48Z"
            className="fill-amber-800 dark:fill-amber-900"
          />
          <path
            d="M36 48 C34 52 32 62 34 72 C36 68 37 58 38 52Z"
            className="fill-amber-800 dark:fill-amber-900"
          />
          <path
            d="M84 48 C86 52 88 62 86 72 C84 68 83 58 82 52Z"
            className="fill-amber-800 dark:fill-amber-900"
          />
        </>
      )}

      {/* Eyes */}
      <ellipse cx="50" cy="46" rx="3" ry="3.5" className="fill-slate-700 dark:fill-slate-300" />
      <ellipse cx="70" cy="46" rx="3" ry="3.5" className="fill-slate-700 dark:fill-slate-300" />
      <circle cx="51.5" cy="45" r="1" className="fill-white" />
      <circle cx="71.5" cy="45" r="1" className="fill-white" />

      {/* Eyebrows */}
      <path d="M45 40 Q50 37 55 40" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-900 dark:stroke-amber-950" fill="none" />
      <path d="M65 40 Q70 37 75 40" strokeWidth="1.5" strokeLinecap="round" className="stroke-amber-900 dark:stroke-amber-950" fill="none" />

      {/* Nose */}
      <path d="M58 50 Q60 54 62 50" strokeWidth="1.2" strokeLinecap="round" className="stroke-amber-400 dark:stroke-amber-600" fill="none" />

      {/* Mouth - slight smile */}
      <path d="M52 58 Q60 64 68 58" strokeWidth="1.5" strokeLinecap="round" className="stroke-rose-400 dark:stroke-rose-500" fill="none" />

      {/* Hospital wristband */}
      <rect x="84" y="94" width="8" height="3" rx="1.5" className="fill-white dark:fill-slate-300" />
    </svg>
  );
}
