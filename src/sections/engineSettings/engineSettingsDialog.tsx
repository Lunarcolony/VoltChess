import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  OutlinedInput,
  Button,
  Grid,
  useTheme,
} from "@mui/material";
import { useEffect } from "react";
import { useAtom } from "jotai";
import Slider from "@/components/slider";
import ArrowOptions from "./arrowOptions";
import { EngineName } from "@/types/enums";
import {
  engineNameAtom,
  engineDepthAtom,
  engineMultiPvAtom,
  engineWorkersNbAtom,
} from "../analysis/states";
import { boardHueAtom } from "@/components/board/states";
import { useAtomLocalStorage } from "@/hooks/useAtomLocalStorage";
import { isEngineSupported } from "@/lib/engine/shared";
import { Stockfish16_1 } from "@/lib/engine/stockfish16_1";
import {
  DEFAULT_ENGINE,
  ENGINE_LABELS,
  STRONGEST_ENGINE,
} from "@/constants";
import { getRecommendedWorkersNb } from "@/lib/engine/worker";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EngineSettingsDialog({ open, onClose }: Props) {
  const [depth, setDepth] = useAtomLocalStorage("engine-depth", engineDepthAtom);
  const [multiPv, setMultiPv] = useAtomLocalStorage("engine-multi-pv", engineMultiPvAtom);
  const [engineName, setEngineName] = useAtomLocalStorage("engine-name", engineNameAtom);
  const [boardHue, setBoardHue] = useAtom(boardHueAtom);
  const [engineWorkersNb, setEngineWorkersNb] = useAtom(engineWorkersNbAtom);

  const theme = useTheme();

  useEffect(() => {
    if (!isEngineSupported(engineName)) {
      if (Stockfish16_1.isSupported()) {
        setEngineName(EngineName.Stockfish16_1Lite);
      } else {
        setEngineName(EngineName.Stockfish11);
      }
    }
  }, [engineName, setEngineName]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", pb: 1 }}>Settings</DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {ENGINE_LABELS[DEFAULT_ENGINE].small} is the default engine if your device supports its
          requirements. It offers the best balance between speed and strength.{" "}
          {ENGINE_LABELS[STRONGEST_ENGINE].small} is the strongest engine available, note that it
          requires a one-time download of {ENGINE_LABELS[STRONGEST_ENGINE].sizeMb}MB and is much
          more compute intensive.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="engine-select-label">Engine</InputLabel>
              <Select
                labelId="engine-select-label"
                value={engineName}
                onChange={(e) => setEngineName(e.target.value as EngineName)}
                input={<OutlinedInput label="Engine" />}
              >
                {Object.values(EngineName).map((engine) => (
                  <MenuItem
                    key={engine}
                    value={engine}
                    disabled={!isEngineSupported(engine)}
                  >
                    {ENGINE_LABELS[engine].full}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Slider label="Maximum depth" value={depth} setValue={setDepth} min={10} max={30} marksFilter={2} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Slider label="Number of lines" value={multiPv} setValue={setMultiPv} min={2} max={6} marksFilter={1} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Slider label="Board hue" value={boardHue} setValue={setBoardHue} min={0} max={360} />
          </Grid>

          <Grid item xs={12}>
            <ArrowOptions />
          </Grid>

          <Grid item xs={12}>
            <Slider
              label="Number of threads"
              value={engineWorkersNb}
              setValue={setEngineWorkersNb}
              min={1}
              max={12}
              marksFilter={1}
              infoContent={
                <>
                  More threads means faster analysis, but only if your device can handle them. Try
                  values between 1 and {getRecommendedWorkersNb()} for best performance.
                </>
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
