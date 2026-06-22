interface ChessComPlayer {
  username: string;
  rating: number;
  result?: string;
  title?: string;
}

export interface ChessComGame {
  uuid: string;
  id: string;
  url: string;
  pgn: string;
  white: ChessComPlayer;
  black: ChessComPlayer;
  result: string;
  time_control: string;
  time_class?: string;
  end_time: number;
  eco?: string;
  termination?: string;
}
