import { Grid2 as Grid, Tab, Tabs, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import {
  DataGrid,
  GridColDef,
  GridLocaleText,
  GRID_DEFAULT_LOCALE_TEXT,
  GridActionsCellItem,
  GridRowId,
} from "@mui/x-data-grid";
import { useCallback, useMemo, useState } from "react";
import { red } from "@mui/material/colors";
import LoadGameButton from "@/sections/loadGame/loadGameButton";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { useServerGames, removeServerGame } from "@/hooks/useGameApi";
import { useAuth } from "@/contexts/AuthContext";
import { ENABLE_AUTHENTICATION } from "@/constants";
import { useRouter } from "@/hooks/useRouter";
import { PageTitle } from "@/components/pageTitle";
import { useQueryClient } from "@tanstack/react-query";

const gridLocaleText: GridLocaleText = {
  ...GRID_DEFAULT_LOCALE_TEXT,
  noRowsLabel: "No games found",
};

function GameDatabase() {
  const [tab, setTab] = useState(0);
  const { games, deleteGame } = useGameDatabase(true);
  const { isAuthenticated } = useAuth();
  const { data: serverGames = [], isLoading: serverLoading } = useServerGames();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleDeleteLocal = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "number") return;
      await deleteGame(id);
    },
    [deleteGame]
  );

  const handleDeleteServer = useCallback(
    (id: GridRowId) => async () => {
      if (typeof id !== "string") return;
      await removeServerGame(id);
      queryClient.invalidateQueries({ queryKey: ["server-games"] });
    },
    [queryClient]
  );

  const localColumns: GridColDef[] = useMemo(
    () => [
      { field: "event", headerName: "Event", width: 150 },
      { field: "date", headerName: "Date", width: 120 },
      {
        field: "whiteLabel",
        headerName: "White",
        width: 180,
        valueGetter: (_, row) =>
          `${row.white.name ?? "Unknown"} (${row.white.rating ?? "?"})`,
      },
      {
        field: "blackLabel",
        headerName: "Black",
        width: 180,
        valueGetter: (_, row) =>
          `${row.black.name ?? "Unknown"} (${row.black.rating ?? "?"})`,
      },
      {
        field: "eval",
        headerName: "Evaluated",
        type: "boolean",
        width: 100,
        valueGetter: (_, row) => !!row.eval,
      },
      {
        field: "open",
        type: "actions",
        headerName: "Analyze",
        width: 90,
        getActions: ({ id }) => [
          <GridActionsCellItem
            icon={<Icon icon="streamline:magnifying-glass-solid" width="20px" />}
            label="Analyze"
            onClick={() => router.push(`/analysis?gameId=${id}`)}
            key={`local-${id}`}
          />,
        ],
      },
      {
        field: "delete",
        type: "actions",
        width: 80,
        getActions: ({ id }) => [
          <GridActionsCellItem
            icon={<Icon icon="mdi:delete-outline" color={red[400]} width="20px" />}
            label="Delete"
            onClick={handleDeleteLocal(id)}
            key={`del-${id}`}
          />,
        ],
      },
    ],
    [handleDeleteLocal, router]
  );

  const serverColumns: GridColDef[] = useMemo(
    () => [
      { field: "date", headerName: "Date", width: 120 },
      {
        field: "matchup",
        headerName: "Game",
        flex: 1,
        minWidth: 200,
        valueGetter: (_, row) =>
          `${row.white.name} vs ${row.black.name}`,
      },
      { field: "result", headerName: "Result", width: 80 },
      {
        field: "has_eval",
        headerName: "Analyzed",
        type: "boolean",
        width: 100,
      },
      {
        field: "open",
        type: "actions",
        headerName: "Analyze",
        width: 90,
        getActions: ({ id }) => [
          <GridActionsCellItem
            icon={<Icon icon="streamline:magnifying-glass-solid" width="20px" />}
            label="Analyze"
            onClick={() => router.push(`/analysis?gameId=${id}`)}
            key={`srv-${id}`}
          />,
        ],
      },
      {
        field: "delete",
        type: "actions",
        width: 80,
        getActions: ({ id }) => [
          <GridActionsCellItem
            icon={<Icon icon="mdi:delete-outline" color={red[400]} width="20px" />}
            label="Delete"
            onClick={handleDeleteServer(id)}
            key={`srv-del-${id}`}
          />,
        ],
      },
    ],
    [handleDeleteServer, router]
  );

  const showServerTab = ENABLE_AUTHENTICATION && isAuthenticated;

  return (
    <Grid container justifyContent="center" alignItems="center" gap={4} marginTop={6}>
      <PageTitle title="VoltChess Game Database — Save & Review Your Games" />

      <Grid container justifyContent="center" size={12}>
        <LoadGameButton />
      </Grid>

      {showServerTab && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Local (${games.length})`} />
          <Tab label={`Server (${serverLoading ? "…" : serverGames.length})`} />
        </Tabs>
      )}

      <Grid maxWidth="100%" minWidth="50px">
        {tab === 0 || !showServerTab ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {games.length} local game{games.length !== 1 && "s"} (this device)
            </Typography>
            <DataGrid
              rows={games}
              columns={localColumns}
              disableColumnMenu
              hideFooter
              localeText={gridLocaleText}
            />
          </>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {serverGames.length} synced game{serverGames.length !== 1 && "s"} (academy)
            </Typography>
            <DataGrid
              rows={serverGames}
              columns={serverColumns}
              getRowId={(r) => r.id}
              loading={serverLoading}
              disableColumnMenu
              hideFooter
              localeText={gridLocaleText}
            />
          </>
        )}
      </Grid>
    </Grid>
  );
}

export default GameDatabase;
