import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "@/sections/layout/Sidebar";

const MOBILE_HEADER = 52;
/** Move nav row shown below the board on mobile analysis pages */
export const MOBILE_MOVE_NAV_HEIGHT = 52;
/** Fixed right panel width on desktop (Chessigma-style) */
export const ANALYSIS_PANEL_WIDTH = 400;
/** Rigid player bar height (top + bottom of board column) */
export const PLAYER_BAR_HEIGHT = 52;
/** Eval bar width + gap next to the board */
const EVAL_BAR_TOTAL = 52;

/** md breakpoint — matches MUI and layout side-by-side */
const MD_BREAKPOINT = 900;

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export const getAnalysisBoardSize = (
  screenWidth: number,
  screenHeight: number
): number => {
  const isSideBySide = screenWidth >= MD_BREAKPOINT;

  if (isSideBySide) {
    // Full-bleed layout: sidebar | middle column | fixed panel
    const middleWidth = screenWidth - SIDEBAR_WIDTH - ANALYSIS_PANEL_WIDTH;
    const maxByWidth = middleWidth - EVAL_BAR_TOTAL - 32;

    // Vertical: two rigid player bars + board area padding
    const maxByHeight = screenHeight - PLAYER_BAR_HEIGHT * 2 - 24;

    return Math.max(280, Math.floor(Math.min(maxByWidth, maxByHeight)));
  }

  const maxByWidth = screenWidth - EVAL_BAR_TOTAL - 16;
  const maxByHeight =
    screenHeight -
    MOBILE_HEADER -
    PLAYER_BAR_HEIGHT * 2 -
    MOBILE_MOVE_NAV_HEIGHT -
    24;

  return Math.max(240, Math.floor(Math.min(maxByWidth, maxByHeight)));
};

export const getPlayBoardSize = (
  screenWidth: number,
  screenHeight: number
): number => {
  const isMobile = screenWidth < MD_BREAKPOINT;
  const isSideBySide = screenWidth >= MD_BREAKPOINT;

  const sidebar = isMobile ? 0 : SIDEBAR_WIDTH;
  const paddingX = isMobile ? 24 : 40;
  const sidePanel = isSideBySide ? 400 : 0;
  const gap = isSideBySide ? 32 : 0;
  const topOffset = isMobile ? MOBILE_HEADER + 60 : 60;

  const maxWidth = screenWidth - sidebar - paddingX - sidePanel - gap;
  const maxHeight = screenHeight - topOffset - PLAYER_BAR_HEIGHT * 2 - 24;

  return Math.max(240, Math.min(maxWidth, maxHeight, isMobile ? 400 : 560));
};
