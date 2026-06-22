import { Chess } from "chess.js";
import PlatformGameLoader from "@/sections/loadGame/PlatformGameLoader";
import { GameOrigin } from "@/types/enums";

interface Props {
  onGameLoaded: (game: Chess, boardOrientation?: boolean) => void;
  defaultTab?: GameOrigin;
  showSampleGame?: boolean;
}

export default function HomeGameLoader(props: Props) {
  return <PlatformGameLoader variant="home" {...props} />;
}
