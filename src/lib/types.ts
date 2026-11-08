export type VariantType = "true_false" | "choice" | "short";

export type KeywordGroup = {
  any: string[];
  points: number;
};

export type Variant =
  | {
      type: "true_false";
      points: number;
      statement: string;
      answer: boolean;
    }
  | {
      type: "choice";
      points: number;
      options: string[];
      answerIndex: number;
    }
  | {
      type: "short";
      points: number;
      hint?: string;
      accepted: string[];
      keywords?: KeywordGroup[];
    };

export type Question = {
  id: string;
  prompt: string;
  explanation: string;
  variants: Variant[];
};

export type ClubStat = {
  value: string;
  label: string;
};

export type ClubFeature = {
  title: string;
  description: string;
};

export type ClubActivity = {
  title: string;
  time: string;
  description: string;
};

export type ClubTheoryCard = {
  title: string;
  body: string;
};

export type ClubContent = {
  name: string;
  monogram: string;
  tagline: string;
  description: string;
  eventNote: string;
  coverImage: string;
  stats: ClubStat[];
  strengths: ClubFeature[];
  activities: ClubActivity[];
  theory: ClubTheoryCard[];
  playNote: string;
};

export type StoryScene = "thought" | "bus" | "yard" | "lab" | "home";

export type StoryLine = {
  speaker: string;
  text: string;
  image?: string;
};

export type StoryStage = {
  id: string;
  title: string;
  scene: StoryScene;
  background?: string;
  portrait?: string;
  lines: StoryLine[];
};

export type SiteContent = {
  club: ClubContent;
  stages: StoryStage[];
  questions: Question[];
};

export type PublicVariant =
  | {
      type: "true_false";
      points: number;
      statement: string;
    }
  | {
      type: "choice";
      points: number;
      options: string[];
    }
  | {
      type: "short";
      points: number;
      hint?: string;
    };

export type PublicQuestion = {
  id: string;
  prompt: string;
  variants: PublicVariant[];
};

export type AttemptStatus = "playing" | "finished";

export type AttemptState = {
  id: string;
  name: string;
  score: number;
  status: AttemptStatus;
  answeredIds: string[];
  totalQuestions: number;
  rank: number | null;
  totalFinished: number | null;
};

export type AttemptResponse = {
  attempt: AttemptState;
  questions: PublicQuestion[];
};

export type AnswerResult = {
  verdict: "correct" | "partial" | "wrong";
  points: number;
  totalScore: number;
  correctAnswer: string;
  explanation: string;
};

export type AnswerResponse = {
  result: AnswerResult;
  finished: boolean;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  rank: number;
};

export type LeaderboardResponse = {
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  total: number;
};

export type AdminAttempt = {
  id: string;
  name: string;
  score: number;
  started_at: string;
  finished_at: string | null;
};
