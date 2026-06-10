import { MoveClassification } from "@/types/enums";

export const GOOD_CLASSIFICATIONS: {
  key: MoveClassification;
  label: string;
}[] = [
  { key: MoveClassification.Splendid, label: "Sigma" },
  { key: MoveClassification.Perfect, label: "Awesome" },
  { key: MoveClassification.Best, label: "Best" },
  { key: MoveClassification.Excellent, label: "Nice" },
  { key: MoveClassification.Okay, label: "Ok" },
  { key: MoveClassification.Opening, label: "Theoretical" },
];

export const BAD_CLASSIFICATIONS: {
  key: MoveClassification;
  label: string;
}[] = [
  { key: MoveClassification.Inaccuracy, label: "Strange" },
  { key: MoveClassification.Mistake, label: "Bad" },
  { key: MoveClassification.Blunder, label: "Clown" },
];
