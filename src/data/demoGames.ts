import type { LoadedGame } from "@/types/game";
import { SAMPLE_GAME_PGN } from "./sampleGame";

const IMMORTAL_GAME_PGN = `[Event "Casual game"]
[Site "London ENG"]
[Date "1851.??.??"]
[White "Anderssen, Adolf"]
[Black "Kieseritzky, Lionel"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5
8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8
15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6
21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`;

const GAME_OF_THE_CENTURY_PGN = `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[White "Byrne, Donald"]
[Black "Fischer, Robert J."]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6
8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4
14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+
20. Kf1 Nxd4+ 21. Kf2 Ne4+ 22. Kg1 Nc3 23. Qc3 Ne2+ 24. Kf1 Nxg3+ 25. Kg1 Ne2+
26. Kf1 Nc3+ 27. Kg1 Ne4+ 28. Kh1 Nd2 29. Qf3 Nxf3 30. h3 Nxh2 31. Kh2 Nxf3+
32. Kg3 Nxd4 33. Bxd4 Bxd4 34. Rxd4 Rxe1 35. Rd7 Rg1+ 36. Kf4 Rf1+ 0-1`;

/** Curated classics for onboarding — no username or API fetch required */
export const DEMO_GAMES: LoadedGame[] = [
  {
    id: "demo-opera",
    pgn: SAMPLE_GAME_PGN,
    date: "1858-06-21",
    white: { name: "Morphy, Paul", rating: 2690 },
    black: { name: "Allies" },
    result: "1-0",
    timeClass: "classical",
    movesNb: 17,
  },
  {
    id: "demo-immortal",
    pgn: IMMORTAL_GAME_PGN,
    date: "1851-06-21",
    white: { name: "Anderssen, Adolf", rating: 2600 },
    black: { name: "Kieseritzky, Lionel" },
    result: "1-0",
    timeClass: "classical",
    movesNb: 23,
  },
  {
    id: "demo-fischer",
    pgn: GAME_OF_THE_CENTURY_PGN,
    date: "1956-10-17",
    white: { name: "Byrne, Donald", rating: 2430 },
    black: { name: "Fischer, Robert J.", rating: 2640 },
    result: "0-1",
    timeClass: "rapid",
    movesNb: 41,
  },
];
