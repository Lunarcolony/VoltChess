import { Grid2 as Grid, Grid2Props as GridProps } from "@mui/material";
import MovesPanel from "./movesPanel";

export default function ClassificationTab(props: GridProps) {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      size={12}
      flexGrow={1}
      {...props}
      sx={
        props.hidden ? { display: "none" } : { overflow: "hidden", ...props.sx }
      }
    >
      <MovesPanel />

    </Grid>
  );
}
