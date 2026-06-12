export type ColorThemeId =
  | "obsidian"
  | "platinum"
  | "roseGold"
  | "emerald"
  | "copper"
  | "ruby"
  | "amethyst"
  | "teal"
  | "coral"
  | "mint"
  | "wine"
  | "slate"
  | "ivory"
  | "graphite"
  | "cherry"
  | "jade"
  | "mauve"
  | "sand"
  | "frost"
  | "pearl"
  | "bronze"
  | "espresso"
  | "smoke"
  | "velvet"
  | "forest";

export type ColorPalette = {
  bg: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentDark: string;
  onAccent: string;
  playerLightBg: string;
  playerLightText: string;
  playerDarkBg: string;
  playerDarkText: string;
  chartAreaFill: string;
};

type AccentSet = Pick<
  ColorPalette,
  "accent" | "accentHover" | "accentDark" | "onAccent"
>;

type ThemeDef = {
  label: string;
  base?: Partial<
    Omit<ColorPalette, "accent" | "accentHover" | "accentDark" | "onAccent">
  >;
  accent: AccentSet;
};

const LUXURY_GREY: ColorPalette = {
  bg: "#090909",
  surface: "#111111",
  surfaceRaised: "#1a1a1a",
  border: "#2e2e2e",
  borderSubtle: "#1c1c1c",
  text: "#ececec",
  textMuted: "#8a8a8a",
  accent: "#b0b0b0",
  accentHover: "#c8c8c8",
  accentDark: "#909090",
  onAccent: "#0d0d0d",
  playerLightBg: "#dcdcdc",
  playerLightText: "#0d0d0d",
  playerDarkBg: "#141414",
  playerDarkText: "#ececec",
  chartAreaFill: "#e4e4e4",
};

function buildTheme(def: ThemeDef): ColorPalette {
  return { ...LUXURY_GREY, ...def.base, ...def.accent };
}

const THEME_DEFS: Record<ColorThemeId, ThemeDef> = {
  obsidian: {
    label: "Obsidian",
    accent: {
      accent: "#b8b8b8",
      accentHover: "#d0d0d0",
      accentDark: "#989898",
      onAccent: "#0d0d0d",
    },
  },
  platinum: {
    label: "Platinum",
    base: { text: "#f2f2f2", textMuted: "#9a9a9a" },
    accent: {
      accent: "#c4c4c4",
      accentHover: "#dcdcdc",
      accentDark: "#a0a0a0",
      onAccent: "#0d0d0d",
    },
  },
  roseGold: {
    label: "Rose Gold",
    base: {
      bg: "#0c0a0a",
      surface: "#141010",
      surfaceRaised: "#1c1616",
      border: "#322a2a",
      borderSubtle: "#221c1c",
      textMuted: "#9a8888",
      playerLightBg: "#e8d8d4",
    },
    accent: {
      accent: "#c49a8a",
      accentHover: "#d4b0a2",
      accentDark: "#a67d70",
      onAccent: "#0d0d0d",
    },
  },
  emerald: {
    label: "Emerald",
    accent: {
      accent: "#5a9a7a",
      accentHover: "#6eb892",
      accentDark: "#467a60",
      onAccent: "#0d0d0d",
    },
  },
  copper: {
    label: "Copper",
    base: { bg: "#0c0a08", surface: "#141210", surfaceRaised: "#1c1a16" },
    accent: {
      accent: "#b87a4a",
      accentHover: "#cc9260",
      accentDark: "#966038",
      onAccent: "#0d0d0d",
    },
  },
  ruby: {
    label: "Ruby",
    base: {
      bg: "#0c0909",
      surface: "#141010",
      border: "#322828",
      textMuted: "#9a8080",
    },
    accent: {
      accent: "#c45c5c",
      accentHover: "#d87878",
      accentDark: "#a04848",
      onAccent: "#0d0d0d",
    },
  },
  amethyst: {
    label: "Amethyst",
    base: {
      bg: "#0a090c",
      surface: "#121014",
      surfaceRaised: "#1a1820",
      border: "#2e2a34",
      textMuted: "#9088a0",
    },
    accent: {
      accent: "#9b7bb8",
      accentHover: "#b094cc",
      accentDark: "#7d6298",
      onAccent: "#0d0d0d",
    },
  },
  teal: {
    label: "Teal",
    base: { bg: "#080c0c", surface: "#101414", surfaceRaised: "#181e1e" },
    accent: {
      accent: "#4a9a94",
      accentHover: "#62b0aa",
      accentDark: "#3a7a76",
      onAccent: "#0d0d0d",
    },
  },
  coral: {
    label: "Coral",
    base: { textMuted: "#9a8880" },
    accent: {
      accent: "#e08070",
      accentHover: "#ec9a8c",
      accentDark: "#c06858",
      onAccent: "#0d0d0d",
    },
  },
  mint: {
    label: "Mint",
    base: {
      bg: "#080c0a",
      surface: "#101410",
      playerLightBg: "#d8e8e0",
    },
    accent: {
      accent: "#7abfa8",
      accentHover: "#92d4be",
      accentDark: "#5e9a86",
      onAccent: "#0d0d0d",
    },
  },
  wine: {
    label: "Wine",
    base: {
      bg: "#0c080a",
      surface: "#141014",
      border: "#302028",
      textMuted: "#9a8088",
    },
    accent: {
      accent: "#8b4558",
      accentHover: "#a45a6e",
      accentDark: "#6e3646",
      onAccent: "#ececec",
    },
  },
  slate: {
    label: "Slate",
    base: {
      bg: "#0a0b0c",
      surface: "#121416",
      surfaceRaised: "#1a1c20",
      border: "#2a2e34",
      textMuted: "#889098",
    },
    accent: {
      accent: "#7a8a9a",
      accentHover: "#92a2b2",
      accentDark: "#626e7c",
      onAccent: "#0d0d0d",
    },
  },
  ivory: {
    label: "Ivory",
    base: {
      bg: "#0c0c0a",
      surface: "#141412",
      text: "#f0ece4",
      textMuted: "#9a9488",
      playerLightBg: "#ece4d4",
      chartAreaFill: "#ece4d4",
    },
    accent: {
      accent: "#c8b8a0",
      accentHover: "#dcccbc",
      accentDark: "#a89880",
      onAccent: "#0d0d0d",
    },
  },
  graphite: {
    label: "Graphite",
    base: {
      bg: "#0a0a0a",
      surface: "#131313",
      surfaceRaised: "#1c1c1c",
      text: "#e0e0e0",
      textMuted: "#787878",
    },
    accent: {
      accent: "#8e98a0",
      accentHover: "#a4aeb6",
      accentDark: "#727a82",
      onAccent: "#0d0d0d",
    },
  },
  cherry: {
    label: "Cherry",
    base: { bg: "#0e0a0a", surface: "#161010", border: "#342424" },
    accent: {
      accent: "#be5a6a",
      accentHover: "#d47484",
      accentDark: "#9a4856",
      onAccent: "#0d0d0d",
    },
  },
  jade: {
    label: "Jade",
    base: {
      bg: "#080a09",
      surface: "#101412",
      surfaceRaised: "#181c1a",
      border: "#28302c",
    },
    accent: {
      accent: "#4a8a6a",
      accentHover: "#5ea882",
      accentDark: "#3a6e54",
      onAccent: "#0d0d0d",
    },
  },
  mauve: {
    label: "Mauve",
    base: {
      bg: "#0c0a0c",
      surface: "#141214",
      textMuted: "#988898",
    },
    accent: {
      accent: "#a88898",
      accentHover: "#c0a0b0",
      accentDark: "#886e7c",
      onAccent: "#0d0d0d",
    },
  },
  sand: {
    label: "Sand",
    base: {
      bg: "#0c0c0a",
      surface: "#141410",
      text: "#ece8e0",
      textMuted: "#9a9488",
      playerLightBg: "#e4dcd0",
      chartAreaFill: "#e4dcd0",
    },
    accent: {
      accent: "#c4a878",
      accentHover: "#d8bc90",
      accentDark: "#a08860",
      onAccent: "#0d0d0d",
    },
  },
  frost: {
    label: "Frost",
    base: {
      bg: "#090a0c",
      surface: "#111216",
      text: "#e8ecf0",
      textMuted: "#889098",
      playerLightBg: "#dce4ec",
      chartAreaFill: "#dce4ec",
    },
    accent: {
      accent: "#98a8b8",
      accentHover: "#b0c0d0",
      accentDark: "#7a8a98",
      onAccent: "#0d0d0d",
    },
  },
  pearl: {
    label: "Pearl",
    base: {
      bg: "#0c0c0c",
      text: "#f4f0ec",
      textMuted: "#a09890",
      playerLightBg: "#f0e8e4",
      chartAreaFill: "#f0e8e4",
    },
    accent: {
      accent: "#d4c0b8",
      accentHover: "#e8d4cc",
      accentDark: "#b0a098",
      onAccent: "#0d0d0d",
    },
  },
  bronze: {
    label: "Bronze",
    base: { bg: "#0a0908", surface: "#121110", border: "#2e2820" },
    accent: {
      accent: "#a08050",
      accentHover: "#b89868",
      accentDark: "#806640",
      onAccent: "#0d0d0d",
    },
  },
  espresso: {
    label: "Espresso",
    base: {
      bg: "#0d0b0a",
      surface: "#151210",
      surfaceRaised: "#1e1a16",
      border: "#302820",
      borderSubtle: "#201c18",
      text: "#e8e0d8",
      textMuted: "#9a9088",
      playerLightBg: "#e0d4c8",
      chartAreaFill: "#e0d4c8",
    },
    accent: {
      accent: "#a87858",
      accentHover: "#c09070",
      accentDark: "#886040",
      onAccent: "#0d0d0d",
    },
  },
  smoke: {
    label: "Smoke",
    base: {
      bg: "#0e0e0e",
      surface: "#161616",
      surfaceRaised: "#202020",
      border: "#343434",
      text: "#f0f0f0",
      textMuted: "#949494",
    },
    accent: {
      accent: "#a0a0a0",
      accentHover: "#b8b8b8",
      accentDark: "#808080",
      onAccent: "#0d0d0d",
    },
  },
  velvet: {
    label: "Velvet",
    base: {
      bg: "#0a080a",
      surface: "#120e12",
      surfaceRaised: "#1a161a",
      border: "#2e2430",
      textMuted: "#988898",
    },
    accent: {
      accent: "#b86898",
      accentHover: "#d080b0",
      accentDark: "#985078",
      onAccent: "#0d0d0d",
    },
  },
  forest: {
    label: "Forest",
    base: {
      bg: "#080a08",
      surface: "#101410",
      surfaceRaised: "#181c18",
      border: "#283028",
      borderSubtle: "#1a201a",
      text: "#e4ece4",
      textMuted: "#889088",
      playerLightBg: "#d4e0d4",
      chartAreaFill: "#d4e0d4",
    },
    accent: {
      accent: "#6a9a6a",
      accentHover: "#82b482",
      accentDark: "#527a52",
      onAccent: "#0d0d0d",
    },
  },
};

export const COLOR_THEME_LABELS = Object.fromEntries(
  Object.entries(THEME_DEFS).map(([id, def]) => [id, def.label])
) as Record<ColorThemeId, string>;

export const COLOR_THEMES = Object.fromEntries(
  Object.entries(THEME_DEFS).map(([id, def]) => [id, buildTheme(def)])
) as Record<ColorThemeId, ColorPalette>;

export const COLOR_THEME_IDS = Object.keys(COLOR_THEMES) as ColorThemeId[];

export const DEFAULT_COLOR_THEME: ColorThemeId = "forest";

const LEGACY_THEME_IDS = new Set(["blueNeutral", "classic"]);

export function normalizeThemeId(id: string): ColorThemeId {
  if (LEGACY_THEME_IDS.has(id) || !(id in COLOR_THEMES)) {
    return DEFAULT_COLOR_THEME;
  }
  return id as ColorThemeId;
}

export function getPalette(themeId: string): ColorPalette {
  return COLOR_THEMES[normalizeThemeId(themeId)];
}
