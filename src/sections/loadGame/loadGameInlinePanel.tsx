import PlatformGameLoader from "./PlatformGameLoader";
import { GameOrigin } from "@/types/enums";
import type { Chess } from "chess.js";

interface Props {
  onLoadGame: (game: Chess) => void | Promise<void>;
  title?: string;
  fillHeight?: boolean;
}

export default function LoadGameInlinePanel({
  onLoadGame,
  title = "Load a game",
  fillHeight = false,
}: Props) {
  return (
    <PlatformGameLoader
      variant="inline"
      title={title}
      fillHeight={fillHeight}
      showSampleGame={false}
      defaultTab={GameOrigin.ChessCom}
      onGameLoaded={(game) => void onLoadGame(game)}
    />
  );
}
