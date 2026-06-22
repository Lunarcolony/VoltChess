import UsernameGameSearch, {
  type GameSearchVariant,
} from "./UsernameGameSearch";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
  presetUsername?: string;
  fullWidth?: boolean;
  fillHeight?: boolean;
  variant?: GameSearchVariant;
}

export default function ChessComInput({
  onSelect,
  presetUsername,
  fillHeight,
  variant,
}: Props) {
  return (
    <UsernameGameSearch
      platform="chesscom"
      onSelect={onSelect}
      presetUsername={presetUsername}
      variant={variant ?? (fillHeight ? "inline" : "home")}
      fillHeight={fillHeight}
    />
  );
}
