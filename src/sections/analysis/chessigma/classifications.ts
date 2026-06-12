import { MoveClassification } from "@/types/enums";
import {
  BAD_CLASSIFICATIONS as BAD_KEYS,
  CLASSIFICATION_DISPLAY_LABELS,
  GOOD_CLASSIFICATIONS as GOOD_KEYS,
} from "../panel/classificationLabels";

export const GOOD_CLASSIFICATIONS = GOOD_KEYS.filter(
  (key) => key !== MoveClassification.Forced
).map((key) => ({
  key,
  label: CLASSIFICATION_DISPLAY_LABELS[key],
}));

export const BAD_CLASSIFICATIONS = BAD_KEYS.map((key) => ({
  key,
  label: CLASSIFICATION_DISPLAY_LABELS[key],
}));
