import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { boardAtom, currentPositionAtom, gameAtom } from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { usePalette } from "@/hooks/usePalette";
import { LICHESS_COLORS } from "./lichess";
import { computeMoveTimes, formatClock, moveTimeY } from "./moveTimes";

const CLOCK_LINE_COLOR = "#3893e8";

interface TimeChartItem {
  ply: number;
  whiteBar?: number;
  blackBar?: number;
  whiteClock?: number;
  blackClock?: number;
  moveLabel: string;
  seconds: number;
  clockAfter: number;
}

function TimeTooltip({ active, payload }: TooltipProps<number, number>) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as TimeChartItem;

  return (
    <Box
      sx={{
        bgcolor: "rgba(22, 21, 18, 0.92)",
        border: "1px solid #404040",
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      <Typography fontSize="0.72rem" fontWeight={600} color="#e0e0e0">
        {data.moveLabel}
      </Typography>
      <Typography fontSize="0.7rem" color="#a0a0a0">
        {data.seconds.toFixed(1)}s · clock {formatClock(data.clockAfter)}
      </Typography>
    </Box>
  );
}

export default function MoveTimesPanel() {
  const palette = usePalette();
  const game = useAtomValue(gameAtom);
  const position = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);

  const moveTimes = useMemo(() => computeMoveTimes(game), [game]);

  const chartData: TimeChartItem[] = useMemo(() => {
    if (!moveTimes.available) return [];

    const maxY = Math.max(
      ...moveTimes.items.map((item) => moveTimeY(item.seconds)),
      0.001
    );
    const maxClock = Math.max(
      ...moveTimes.items.map((item) => item.clockAfter),
      1
    );

    return moveTimes.items.map((item) => {
      const barValue = moveTimeY(item.seconds) / maxY;
      const clockValue = item.clockAfter / maxClock;

      return {
        ply: item.ply,
        whiteBar: item.isWhite ? barValue : undefined,
        blackBar: item.isWhite ? undefined : -barValue,
        whiteClock: item.isWhite ? clockValue : undefined,
        blackClock: item.isWhite ? undefined : -clockValue,
        moveLabel: item.moveLabel,
        seconds: item.seconds,
        clockAfter: item.clockAfter,
      };
    });
  }, [moveTimes]);

  if (!moveTimes.available) {
    return (
      <Box
        sx={{
          p: 2,
          bgcolor: palette.surface,
          border: `1px dashed ${palette.border}`,
          borderRadius: 1.5,
          textAlign: "center",
        }}
      >
        <Typography fontSize="0.82rem" color="text.secondary">
          No clock data in this game. Move times appear for games imported from
          Chess.com or Lichess with [%clk] annotations.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1 }}>
      <Box
        sx={{
          height: { xs: 150, sm: 190 },
          width: "100%",
          bgcolor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 1.5,
          overflow: "hidden",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, left: 0, right: 0, bottom: 4 }}
            barCategoryGap={0}
            barGap={0}
            onClick={(e) => {
              const payload = e?.activePayload?.[0]?.payload as
                | TimeChartItem
                | undefined;
              if (payload) goToMove(payload.ply, game);
            }}
            style={{ cursor: "pointer" }}
          >
            <XAxis dataKey="ply" hide />
            <YAxis domain={[-1.1, 1.1]} hide />

            <Tooltip
              content={<TimeTooltip />}
              isAnimationActive={false}
              cursor={{ fill: "rgba(128,128,128,0.15)" }}
            />

            <Bar
              dataKey="whiteBar"
              fill="rgba(255, 255, 255, 0.85)"
              stroke="#838383"
              strokeWidth={0.5}
              isAnimationActive={false}
            />
            <Bar
              dataKey="blackBar"
              fill="rgba(0, 0, 0, 0.9)"
              stroke="#616161"
              strokeWidth={0.5}
              isAnimationActive={false}
            />

            <Line
              dataKey="whiteClock"
              stroke={CLOCK_LINE_COLOR}
              strokeWidth={1.25}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              dataKey="blackClock"
              stroke={CLOCK_LINE_COLOR}
              strokeWidth={1.25}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />

            <ReferenceLine y={0} stroke="#676664" strokeWidth={1} />

            {position.currentMoveIdx !== undefined &&
              position.currentMoveIdx > 0 && (
                <ReferenceLine
                  x={position.currentMoveIdx}
                  stroke={LICHESS_COLORS.chartLine}
                  strokeWidth={2}
                  strokeOpacity={0.85}
                />
              )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5 }}>
        <Box
          sx={{
            width: 14,
            height: 3,
            bgcolor: CLOCK_LINE_COLOR,
            borderRadius: 1,
          }}
        />
        <Typography fontSize="0.7rem" color="text.secondary" sx={{ flex: 1 }}>
          Remaining clock
        </Typography>
        <Typography fontSize="0.7rem" color="text.secondary">
          Duration {formatClock(moveTimes.durationSeconds)}
        </Typography>
      </Box>

      <Typography fontSize="0.7rem" color="text.secondary" sx={{ px: 0.5 }}>
        Bars show time spent per move (white up, black down, log scale). Click
        the chart to jump to a move.
      </Typography>
    </Box>
  );
}
