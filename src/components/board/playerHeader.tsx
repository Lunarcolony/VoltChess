import { Color } from "@/types/enums";
import { Player } from "@/types/game";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import CapturedPieces from "./capturedPieces";
import { PrimitiveAtom, useAtomValue } from "jotai";
import { Chess } from "chess.js";
import { useMemo } from "react";
import { getPaddedNumber } from "@/lib/helpers";
import { palette } from "@/theme/voltchessTheme";

export interface Props {
  player: Player;
  color: Color;
  gameAtom: PrimitiveAtom<Chess>;
}

export default function PlayerHeader({ color, player, gameAtom }: Props) {
  const game = useAtomValue(gameAtom);
  const gameFen = game.fen();
  const isWhite = color === Color.White;

  const clock = useMemo(() => {
    const turn = game.turn();

    if (turn === color) {
      const history = game.history({ verbose: true });
      const previousFen = history.at(-1)?.before;
      const comment = game
        .getComments()
        .find(({ fen }) => fen === previousFen)?.comment;
      return getClock(comment);
    }

    return getClock(game.getComment());
  }, [game, color]);

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        px: 1.25,
        py: 0.5,
        bgcolor: palette.surfaceRaised,
        border: `1px solid ${palette.border}`,
        borderRadius: 1,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}
      >
        <Avatar
          src={player.avatarUrl}
          alt={player.name}
          variant="circular"
          sx={{
            width: 30,
            height: 30,
            flexShrink: 0,
            bgcolor: isWhite ? "#e8e8e8" : "#1a1a1a",
            color: isWhite ? "#0a0a0a" : palette.text,
            border: `1px solid ${palette.border}`,
            fontSize: "0.8rem",
          }}
        >
          {player.name[0]?.toUpperCase()}
        </Avatar>

        <Stack ml={1} sx={{ minWidth: 0, overflow: "hidden" }}>
          <Stack
            direction="row"
            alignItems="baseline"
            gap={0.5}
            flexWrap="nowrap"
            sx={{ minWidth: 0, overflow: "hidden" }}
          >
            <Typography
              fontSize="0.85rem"
              fontWeight={600}
              noWrap
              sx={{ color: palette.text, minWidth: 0 }}
            >
              {player.name}
            </Typography>
            {player.rating != null && (
              <Typography
                fontSize="0.75rem"
                color="text.secondary"
                noWrap
                sx={{ flexShrink: 0 }}
              >
                ({player.rating})
              </Typography>
            )}
          </Stack>
          <CapturedPieces fen={gameFen} color={color} />
        </Stack>
      </Stack>

      {clock && (
        <Typography
          sx={{
            flexShrink: 0,
            bgcolor: isWhite ? "#e8e8e8" : "#0a0a0a",
            color: isWhite ? "#0a0a0a" : palette.text,
            border: `1px solid ${palette.border}`,
            borderRadius: 1,
            px: 1,
            py: 0.5,
            minWidth: "4.5rem",
            textAlign: "center",
            fontSize: "0.8rem",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock.hours ? `${clock.hours}:` : ""}
          {getPaddedNumber(clock.minutes)}:{getPaddedNumber(clock.seconds)}
          {clock.hours || clock.minutes || clock.seconds > 20
            ? ""
            : `.${clock.tenths}`}
        </Typography>
      )}
    </Box>
  );
}

const getClock = (comment: string | undefined) => {
  if (!comment) return undefined;

  const match = comment.match(/\[%clk (\d+):(\d+):(\d+)(?:\.(\d*))?\]/);
  if (!match) return undefined;

  return {
    hours: parseInt(match[1]),
    minutes: parseInt(match[2]),
    seconds: parseInt(match[3]),
    tenths: match[4] ? parseInt(match[4]) : 0,
  };
};
