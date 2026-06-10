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

export const CLASSIFICATION_DISPLAY_LABELS: Record<MoveClassification, string> =
  {
    [MoveClassification.Splendid]: "Sigma",
    [MoveClassification.Perfect]: "Awesome",
    [MoveClassification.Best]: "Best",
    [MoveClassification.Excellent]: "Nice",
    [MoveClassification.Okay]: "Ok",
    [MoveClassification.Opening]: "Theoretical",
    [MoveClassification.Forced]: "Forced",
    [MoveClassification.Inaccuracy]: "Strange",
    [MoveClassification.Mistake]: "Bad",
    [MoveClassification.Blunder]: "Clown",
  };
