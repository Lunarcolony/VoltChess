import { atomWithStorage } from "jotai/utils";
import { DEFAULT_COLOR_THEME, type ColorThemeId } from "./themes";

export const colorThemeAtom = atomWithStorage<ColorThemeId>(
  "voltchess-color-theme",
  DEFAULT_COLOR_THEME
);
