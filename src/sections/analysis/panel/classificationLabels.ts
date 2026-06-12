import { MoveClassification } from "@/types/enums";

export const GOOD_CLASSIFICATIONS = [
  MoveClassification.Splendid,
  MoveClassification.Perfect,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Okay,
  MoveClassification.Opening,
  MoveClassification.Forced,
] as const;

export const BAD_CLASSIFICATIONS = [
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
] as const;

/** VoltChess move-quality names shown in the UI */
export const CLASSIFICATION_DISPLAY_LABELS: Record<MoveClassification, string> =
  {
    [MoveClassification.Splendid]: "Surge",
    [MoveClassification.Perfect]: "Clean",
    [MoveClassification.Best]: "Best",
    [MoveClassification.Excellent]: "Nice",
    [MoveClassification.Okay]: "Ok",
    [MoveClassification.Opening]: "Book",
    [MoveClassification.Forced]: "Forced",
    [MoveClassification.Inaccuracy]: "Drift",
    [MoveClassification.Mistake]: "Slip",
    [MoveClassification.Blunder]: "Shock",
  };
