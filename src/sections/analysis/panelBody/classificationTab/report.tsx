import { Grid2 as Grid, Grid2Props as GridProps } from "@mui/material";
import MovesClassificationsRecap from "./movesClassificationsRecap";

export default function ClassificationTab(props: GridProps) {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="Center"
      size={12}
      flexGrow={1}
      {...props}
      sx={
        props.hidden ? { display: "none" } : { overflow: "hidden", ...props.sx }
      }
    >

      <MovesClassificationsRecap />
    </Grid>
  );
}
