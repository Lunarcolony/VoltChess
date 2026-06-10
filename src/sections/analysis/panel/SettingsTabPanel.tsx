import {
  Box,
  Button,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { ReactNode, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import LoadGame from "../panelHeader/loadGame";
import EngineSettingsDialog from "@/sections/engineSettings/engineSettingsDialog";
import {
  boardOrientationAtom,
  engineDepthAtom,
  engineNameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { palette } from "@/theme/voltchessTheme";
import { ENGINE_LABELS } from "@/constants";
import { MoveClassification } from "@/types/enums";
import {
  BAD_CLASSIFICATIONS,
  CLASSIFICATION_DISPLAY_LABELS,
  GOOD_CLASSIFICATIONS,
} from "./classificationLabels";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        p: 1.5,
      }}
    >
      <Typography
        fontSize="0.72rem"
        fontWeight={700}
        color="text.secondary"
        sx={{ mb: 1.25, textTransform: "uppercase", letterSpacing: "0.05em" }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 0.5,
      }}
    >
      <Typography fontSize="0.85rem">{label}</Typography>
      <Switch
        size="small"
        checked={checked}
        onChange={(_, value) => onChange(value)}
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": { color: palette.accent },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            bgcolor: palette.accent,
          },
        }}
      />
    </Box>
  );
}

function ClassificationItem({
  classification,
}: {
  classification: MoveClassification;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, py: 0.4 }}>
      <Box
        component="img"
        src={`/icons/${classification}.png`}
        alt={classification}
        sx={{ width: 18, height: 18, flexShrink: 0 }}
      />
      <Typography fontSize="0.8rem" noWrap>
        {CLASSIFICATION_DISPLAY_LABELS[classification]}
      </Typography>
    </Box>
  );
}

export default function SettingsTabPanel() {
  const [showArrow, setShowArrow] = useAtom(showBestMoveArrowAtom);
  const [showMoveIcon, setShowMoveIcon] = useAtom(showPlayerMoveIconAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);
  const engineName = useAtomValue(engineNameAtom);
  const engineDepth = useAtomValue(engineDepthAtom);
  const [engineDialogOpen, setEngineDialogOpen] = useState(false);

  return (
    <Stack gap={1.5} sx={{ pb: 1 }}>
      <Section title="Game">
        <LoadGame />
      </Section>

      <Section title="Classification names">
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {GOOD_CLASSIFICATIONS.filter(
              (c) => c !== MoveClassification.Forced
            ).map((classification) => (
              <ClassificationItem
                key={classification}
                classification={classification}
              />
            ))}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {BAD_CLASSIFICATIONS.map((classification) => (
              <ClassificationItem
                key={classification}
                classification={classification}
              />
            ))}
          </Box>
        </Box>
        <Typography
          fontSize="0.7rem"
          color="text.secondary"
          sx={{ mt: 1, textAlign: "center" }}
        >
          Settings stored locally. Not synced across devices.
        </Typography>
      </Section>

      <Section title="Board">
        <ToggleRow
          label="Show best move arrow"
          checked={showArrow}
          onChange={setShowArrow}
        />
        <ToggleRow
          label="Show move classification icons"
          checked={showMoveIcon}
          onChange={setShowMoveIcon}
        />
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<Icon icon="eva:flip-fill" width={16} />}
          onClick={() => setBoardOrientation((prev) => !prev)}
          sx={{ mt: 1 }}
        >
          Flip board
        </Button>
      </Section>

      <Section title="Engine">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography fontSize="0.85rem">
            {ENGINE_LABELS[engineName]?.small ?? "Stockfish"}
          </Typography>
          <Typography fontSize="0.78rem" color="text.secondary">
            Depth{" "}
            <Box
              component="span"
              sx={{ color: palette.accent, fontWeight: 700 }}
            >
              {engineDepth}
            </Box>
          </Typography>
        </Box>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<Icon icon="mdi:cog-outline" width={16} />}
          onClick={() => setEngineDialogOpen(true)}
        >
          Engine settings
        </Button>
      </Section>

      <EngineSettingsDialog
        open={engineDialogOpen}
        onClose={() => setEngineDialogOpen(false)}
      />
    </Stack>
  );
}
