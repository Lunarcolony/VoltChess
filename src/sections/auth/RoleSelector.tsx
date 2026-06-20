import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { usePalette } from "@/hooks/usePalette";
import { UserRole } from "@/types/user";

type SelectableRole = UserRole.Coach | UserRole.Student;

const ROLE_OPTIONS: {
  role: SelectableRole;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    role: UserRole.Student,
    label: "Student",
    description: "Join a coach's classroom, sync your games, get feedback.",
    icon: "mdi:school-outline",
  },
  {
    role: UserRole.Coach,
    label: "Coach",
    description: "Create a classroom, invite students, track their progress.",
    icon: "mdi:whistle-outline",
  },
];

/**
 * Two-card picker that lets a new user choose whether they are signing up as a
 * Student or a Coach. Shared by the registration page (and available to any
 * future flow that needs role selection) so the choice looks and behaves
 * consistently across the app.
 */
export default function RoleSelector({
  value,
  onChange,
}: {
  value: SelectableRole | null;
  onChange: (role: SelectableRole) => void;
}) {
  const palette = usePalette();

  return (
    <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
      {ROLE_OPTIONS.map((opt) => {
        const selected = value === opt.role;
        return (
          <Box
            key={opt.role}
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={() => onChange(opt.role)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChange(opt.role);
              }
            }}
            sx={{
              flex: 1,
              cursor: "pointer",
              borderRadius: 2,
              p: 1.75,
              textAlign: "center",
              userSelect: "none",
              bgcolor: selected
                ? alpha(palette.accent, 0.12)
                : palette.surfaceRaised,
              border: `2px solid ${selected ? palette.accent : palette.border}`,
              transition:
                "border-color 0.15s ease, background-color 0.15s ease",
              "&:hover": {
                borderColor: selected
                  ? palette.accent
                  : alpha(palette.accent, 0.5),
              },
            }}
          >
            <Icon
              icon={opt.icon}
              width={28}
              color={selected ? palette.accent : palette.textMuted}
            />
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "0.95rem",
                mt: 0.5,
                color: selected ? palette.accent : palette.text,
              }}
            >
              {opt.label}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5, color: palette.textMuted }}
            >
              {opt.description}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
