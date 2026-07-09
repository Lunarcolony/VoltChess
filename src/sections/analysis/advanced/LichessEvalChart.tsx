import { Box, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DotProps, TooltipProps } from "recharts";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { usePalette } from "@/hooks/usePalette";
import { MoveClassification } from "@/types/enums";
import {
  LICHESS_COLORS,
  getWinningChances,
  renderLichessEval,
} from "./lichess";
import { computeDivision } from "./division";

interface EvalChartItem {
  ply: number;
  chances: number;
  moveLabel: string;
  evalLabel: string;
  judgment?: string;
  dotColor?: string;
}

const DOT_COLORS: Partial<Record<MoveClassification, string>> = {
  [MoveClassification.Blunder]: LICHESS_COLORS.chartDotBlunder,
  [MoveClassification.Mistake]: LICHESS_COLORS.chartDotMistake,
  [MoveClassification.Inaccuracy]: LICHESS_COLORS.chartDotInaccuracy,
  [MoveClassification.Splendid]: LICHESS_COLORS.brilliant,
};

const JUDGMENT_LABELS: Partial<Record<MoveClassification, string>> = {
  [MoveClassification.Blunder]: "Blunder",
  [MoveClassification.Mistake]: "Mistake",
  [MoveClassification.Inaccuracy]: "Inaccuracy",
  [MoveClassification.Splendid]: "Brilliant",
};

function ChartTooltip({ active, payload }: TooltipProps<number, number>) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as EvalChartItem;

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
        {data.judgment ? ` · ${data.judgment}` : ""}
      </Typography>
      <Typography fontSize="0.7rem" color="#a0a0a0">
        Advantage: {data.evalLabel}
      </Typography>
    </Box>
  );
}

export default function LichessEvalChart() {
  const palette = usePalette();
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const position = useAtomValue(currentPositionAtom);
  const { goToMove } = useChessActions(boardAtom);

  const history = useMemo(() => game.history({ verbose: true }), [game]);

  const chartData: EvalChartItem[] = useMemo(() => {
    if (!gameEval) return [];

    return gameEval.positions.map((positionEval, index) => {
      const move = index > 0 ? history[index - 1] : undefined;
      const moveNumber = Math.ceil(index / 2);
      const moveLabel = move
        ? `${moveNumber}${index % 2 === 1 ? "." : "…"} ${move.san}`
        : "Start";
      const classification = positionEval.moveClassification;

      return {
        ply: index,
        chances: getWinningChances(positionEval.lines[0]),
        moveLabel,
        evalLabel: renderLichessEval(positionEval.lines[0]),
        judgment: classification ? JUDGMENT_LABELS[classification] : undefined,
        dotColor: classification ? DOT_COLORS[classification] : undefined,
      };
    });
  }, [gameEval, history]);

  const division = useMemo(() => computeDivision(history), [history]);

  const renderDot = useCallback(
    (
      props: DotProps & { payload?: EvalChartItem }
    ): ReactElement<SVGElement> => {
      const dotColor = props.payload?.dotColor;
      if (!dotColor) return <svg key={props.key} />;

      return (
        <circle
          key={props.key}
          cx={props.cx}
          cy={props.cy}
          r={3}
          fill={dotColor}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={1}
        />
      );
    },
    []
  );

  if (!gameEval || chartData.length < 2) return null;

  return (
    <Box
      sx={{
        height: { xs: 110, sm: 140 },
        width: "100%",
        bgcolor: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, left: 0, right: 0, bottom: 2 }}
          onClick={(e) => {
            const payload = e?.activePayload?.[0]?.payload as
              | EvalChartItem
              | undefined;
            if (payload) goToMove(payload.ply, game);
          }}
          style={{ cursor: "pointer" }}
        >
          <defs>
            <linearGradient id="lichessWinChances" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LICHESS_COLORS.chartWhiteFill} />
              <stop offset="50%" stopColor={LICHESS_COLORS.chartWhiteFill} />
              <stop offset="50%" stopColor={LICHESS_COLORS.chartBlackFill} />
              <stop offset="100%" stopColor={LICHESS_COLORS.chartBlackFill} />
            </linearGradient>
          </defs>

          <XAxis dataKey="ply" hide />
          <YAxis domain={[-1.05, 1.05]} hide />

          <Tooltip
            content={<ChartTooltip />}
            isAnimationActive={false}
            cursor={{ stroke: "grey", strokeWidth: 1, strokeOpacity: 0.4 }}
          />

          <Area
            type="monotone"
            dataKey="chances"
            stroke={LICHESS_COLORS.chartLine}
            strokeWidth={1.5}
            fill="url(#lichessWinChances)"
            fillOpacity={1}
            baseValue={-1.05}
            dot={renderDot}
            activeDot={{ r: 3.5, fill: LICHESS_COLORS.chartLine }}
            isAnimationActive={false}
          />

          <ReferenceLine y={0} stroke="#676664" strokeWidth={1} />

          {division.middlegame !== undefined && (
            <ReferenceLine
              x={division.middlegame}
              stroke="#676664"
              strokeDasharray="3 3"
              label={{
                value: "Middlegame",
                angle: -90,
                position: "insideTopLeft",
                fill: "#8a8a8a",
                fontSize: 9,
                offset: 8,
              }}
            />
          )}
          {division.endgame !== undefined && (
            <ReferenceLine
              x={division.endgame}
              stroke="#676664"
              strokeDasharray="3 3"
              label={{
                value: "Endgame",
                angle: -90,
                position: "insideTopLeft",
                fill: "#8a8a8a",
                fontSize: 9,
                offset: 8,
              }}
            />
          )}

          {position.currentMoveIdx !== undefined && (
            <ReferenceLine
              x={position.currentMoveIdx}
              stroke={LICHESS_COLORS.chartLine}
              strokeWidth={2}
              strokeOpacity={0.85}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
