import { Icon } from "@iconify/react";
import { Grid2 as Grid, Typography, Button} from "@mui/material";
import LoadGame from "./loadGame";
import AnalyzeButton from "./treegame";
import LinearProgressBar from "@/components/LinearProgressBar";
import { useAtomValue } from "jotai";
import { evaluationProgressAtom } from "../states";
import { useRouter } from "@/hooks/useRouter";
export default function PanelHeader() {
  const evaluationProgress = useAtomValue(evaluationProgressAtom);
  const router = useRouter();
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      rowGap={2}
      size={12}
    >
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        columnGap={1}
        size={12}
      >
        <Icon icon="streamline:clipboard-check" height={24} />

        <Typography variant="h5" align="center">
          Game Analysis
        </Typography>
      </Grid>

      <Grid
        container
        justifyContent="center"
        alignItems="center"
        rowGap={2}
        columnGap={12}
        size={12}
      >
        <LoadGame />
              {/* Game Review Button */}
              <Grid container justifyContent="center" alignItems="center" columnGap={1}>
                  <Button
                      variant="contained"
                      size="small"
                      onClick={() => router.push("/analysis")}
                  >
                      <Typography fontSize="0.9em" fontWeight="500" lineHeight="1.4em">
                          Game report
                      </Typography>
                  </Button>
              </Grid>
        <LinearProgressBar value={evaluationProgress} label="Analyzing..." />
        <AnalyzeButton />
      </Grid>
    </Grid>
  );
}
