import UsernameGameSearch, {
  type GameSearchVariant,
} from "./UsernameGameSearch";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
  fullWidth?: boolean;
  fillHeight?: boolean;
  variant?: GameSearchVariant;
}

export default function LichessInput({ onSelect, fillHeight, variant }: Props) {
  return (
    <UsernameGameSearch
      platform="lichess"
      onSelect={onSelect}
      variant={variant ?? (fillHeight ? "inline" : "home")}
      fillHeight={fillHeight}
    />
  );
}
