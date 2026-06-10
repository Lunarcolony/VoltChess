import { useEffect, useState } from "react";
import { SIDEBAR_WIDTH } from "@/sections/layout/Sidebar";

const MOBILE_HEADER = 52;
const MAIN_PADDING_X = 16;
const MAIN_PADDING_Y = 20;

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
  const isMobile = screenWidth < MD_BREAKPOINT;
  const isSideBySide = screenWidth >= MD_BREAKPOINT;

  const sidebar = isMobile ? 0 : SIDEBAR_WIDTH;
  const paddingX = isMobile ? MAIN_PADDING_X * 2 : MAIN_PADDING_X * 2 + 16;
  const panelWidth = isSideBySide ? 520 : 0;
  const gap = isSideBySide ? 24 : 0;
  const topOffset = isMobile ? MOBILE_HEADER + MAIN_PADDING_Y + 36 : MAIN_PADDING_Y + 36;

  const maxWidth = screenWidth - sidebar - paddingX - panelWidth - gap;
  const maxHeight = screenHeight - topOffset - MAIN_PADDING_Y;

  return Math.max(240, Math.min(maxWidth, maxHeight, isMobile ? 420 : 600));
};

export const getPlayBoardSize = (
  screenWidth: number,
  screenHeight: number
): number => {
  const isMobile = screenWidth < MD_BREAKPOINT;
  const isSideBySide = screenWidth >= MD_BREAKPOINT;

  const sidebar = isMobile ? 0 : SIDEBAR_WIDTH;
  const paddingX = isMobile ? MAIN_PADDING_X * 2 : MAIN_PADDING_X * 2 + 16;
  const sidePanel = isSideBySide ? 400 : 0;
  const gap = isSideBySide ? 32 : 0;
  const topOffset = isMobile ? MOBILE_HEADER + MAIN_PADDING_Y + 48 : MAIN_PADDING_Y + 48;

  const maxWidth = screenWidth - sidebar - paddingX - sidePanel - gap;
  const maxHeight = screenHeight - topOffset - MAIN_PADDING_Y;

  return Math.max(240, Math.min(maxWidth, maxHeight, isMobile ? 400 : 560));
};
