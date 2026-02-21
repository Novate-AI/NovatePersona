export interface ChecklistCategory {
  id: string;
  label: string;
  shortLabel: string;
  keywords: RegExp[];
  covered: boolean;
}

export function createChecklist(): ChecklistCategory[] {
  return [
    {
      id: "pc",
      label: "Presenting Complaint",
      shortLabel: "PC",
      keywords: [
        /what brings you/i, /what('s| is) (the )?(problem|matter|wrong)/i,
        /how can i help/i, /tell me (about|what)/i, /come in today/i,
        /what happened/i, /reason for (your )?visit/i,
      ],
      covered: false,
    },
    {
      id: "hpc_site",
      label: "Site / Location",
      shortLabel: "Site",
      keywords: [
        /where (does it|is the|exactly)/i, /location/i, /point to/i,
        /which (part|side|area)/i, /show me where/i,
      ],
      covered: false,
    },
    {
      id: "hpc_onset",
      label: "Onset / Duration",
      shortLabel: "Onset",
      keywords: [
        /when did (it|this) (start|begin)/i, /how long/i,
        /first (notice|start|happen)/i, /sudden or gradual/i,
        /come on/i, /how many (days|weeks|hours)/i,
      ],
      covered: false,
    },
    {
      id: "hpc_character",
      label: "Character of Pain",
      shortLabel: "Character",
      keywords: [
        /what (does it|kind of|type of) (feel|pain)/i, /describe/i,
        /sharp|dull|aching|burning|throbbing|crushing|stabbing/i,
        /what is it like/i, /nature of/i,
      ],
      covered: false,
    },
    {
      id: "hpc_radiation",
      label: "Radiation",
      shortLabel: "Radiation",
      keywords: [
        /spread|radiat/i, /go anywhere/i, /move (to|from)/i,
        /travel/i, /anywhere else/i,
      ],
      covered: false,
    },
    {
      id: "hpc_severity",
      label: "Severity",
      shortLabel: "Severity",
      keywords: [
        /how (bad|severe|painful)/i, /scale/i, /(rate|score).*(out of|\/)/i,
        /1 to 10/i, /one to ten/i, /worst/i, /severity/i,
      ],
      covered: false,
    },
    {
      id: "hpc_timing",
      label: "Timing / Pattern",
      shortLabel: "Timing",
      keywords: [
        /constant|come and go|intermittent/i, /worse at (night|morning|any time)/i,
        /pattern/i, /how often/i, /frequency/i, /every/i,
      ],
      covered: false,
    },
    {
      id: "hpc_exacerbating",
      label: "Aggravating / Relieving",
      shortLabel: "Agg/Relieve",
      keywords: [
        /make.*(worse|better)/i, /anything (help|relieve|ease|aggravat)/i,
        /trigger/i, /bring it on/i, /improve/i, /exacerbat/i,
      ],
      covered: false,
    },
    {
      id: "hpc_associated",
      label: "Associated Symptoms",
      shortLabel: "Associated",
      keywords: [
        /anything else/i, /other symptoms/i, /associated/i,
        /notice anything/i, /nausea|vomit|sweating|dizz|fever|weight/i,
      ],
      covered: false,
    },
    {
      id: "pmh",
      label: "Past Medical History",
      shortLabel: "PMH",
      keywords: [
        /medical history/i, /(medical |health )?condition/i,
        /previous (illness|problem|diagnosis)/i, /hospital/i,
        /surgery|operation/i, /chronic/i, /diagnosed/i,
      ],
      covered: false,
    },
    {
      id: "drugs",
      label: "Drug History",
      shortLabel: "Drugs",
      keywords: [
        /medication|medicine/i, /taking anything/i, /pills|tablets/i,
        /prescri/i, /over the counter/i, /regular (tablet|medication)/i,
        /drug history/i,
      ],
      covered: false,
    },
    {
      id: "allergies",
      label: "Allergies",
      shortLabel: "Allergies",
      keywords: [
        /allerg/i, /react (to|badly)/i, /sensitive to/i,
      ],
      covered: false,
    },
    {
      id: "social",
      label: "Social History",
      shortLabel: "Social",
      keywords: [
        /smok/i, /alcohol|drink/i, /occupation|work|job/i,
        /who do you live/i, /live (with|alone)/i, /married|partner/i,
        /diet|exercise/i, /recreat/i,
      ],
      covered: false,
    },
    {
      id: "family",
      label: "Family History",
      shortLabel: "Family Hx",
      keywords: [
        /family/i, /mother|father|parent/i, /brother|sister|sibling/i,
        /run in (the|your) family/i, /hereditary|genetic/i,
      ],
      covered: false,
    },
    {
      id: "ice",
      label: "Ideas, Concerns, Expectations",
      shortLabel: "ICE",
      keywords: [
        /what do you think/i, /worry|worried|concern/i,
        /afraid|fear|scared/i, /hoping|expect/i,
        /what (are you|were you) (hoping|expecting)/i,
        /your (thought|idea|understanding)/i,
      ],
      covered: false,
    },
    {
      id: "examination",
      label: "Examination",
      shortLabel: "Exam",
      keywords: [
        /examin/i, /check|assess/i, /look at/i, /feel your/i,
        /listen to/i, /blood pressure|pulse|temperature/i,
        /auscultat/i, /palpat/i, /inspect/i, /physical/i,
      ],
      covered: false,
    },
  ];
}

export function updateChecklist(
  checklist: ChecklistCategory[],
  userMessage: string
): ChecklistCategory[] {
  return checklist.map((cat) => {
    if (cat.covered) return cat;
    const nowCovered = cat.keywords.some((re) => re.test(userMessage));
    return nowCovered ? { ...cat, covered: true } : cat;
  });
}

export function getCompletionPercentage(checklist: ChecklistCategory[]): number {
  const covered = checklist.filter((c) => c.covered).length;
  return Math.round((covered / checklist.length) * 100);
}

export interface OsceEvaluation {
  history_taking: { score: number; feedback: string };
  communication: { score: number; feedback: string };
  clinical_reasoning: { score: number; feedback: string };
  patient_centered: { score: number; feedback: string };
  overall_score: number;
  grade: string;
  summary: string;
  missed_areas: string[];
  strengths: string[];
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api/chat', '') || 'http://localhost:5000';

export async function evaluateConsultation(
  messages: { role: string; content: string }[],
  scenarioName: string
): Promise<OsceEvaluation | null> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "STUDENT" : "PATIENT"}: ${m.content}`)
    .join("\n");

  try {
    const resp = await fetch(`${BACKEND_URL}/api/chat/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, scenario: scenarioName }),
    });

    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}
