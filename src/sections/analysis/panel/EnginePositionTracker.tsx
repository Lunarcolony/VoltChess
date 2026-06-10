import { useEngine } from "@/hooks/useEngine";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import { engineNameAtom } from "../states";
import { useAtomValue } from "jotai";

/** Keeps live engine evaluation in sync for the Analysis tab. */
export default function EnginePositionTracker() {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);
  return null;
}
