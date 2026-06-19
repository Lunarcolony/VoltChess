export const ASSIGNMENT_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "opening", label: "Opening" },
  { value: "tactics", label: "Tactics" },
  { value: "endgame", label: "Endgame" },
  { value: "game_review", label: "Game review" },
  { value: "homework", label: "Homework" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "#94a3b8" },
  { value: "normal", label: "Normal", color: "#E8B923" },
  { value: "high", label: "High", color: "#ef4444" },
] as const;

export const COACH_NAV = [
  {
    label: "Command Center",
    href: "/coach",
    icon: "mdi:view-dashboard-outline",
  },
  {
    label: "Students",
    href: "/coach/students",
    icon: "mdi:account-group-outline",
  },
  {
    label: "Assignments",
    href: "/coach/assignments",
    icon: "mdi:clipboard-text-outline",
  },
  {
    label: "Templates",
    href: "/coach/templates",
    icon: "mdi:book-open-variant",
  },
  { label: "Messages", href: "/coach/messages", icon: "mdi:email-outline" },
  {
    label: "Training Plans",
    href: "/coach/plans",
    icon: "mdi:calendar-month-outline",
  },
  { label: "Analytics", href: "/coach/analytics", icon: "mdi:chart-line" },
] as const;

export function engagementColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#E8B923";
  return "#ef4444";
}

export function formatCategory(cat: string): string {
  return ASSIGNMENT_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}
