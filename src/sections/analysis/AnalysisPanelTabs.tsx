import { Box, Tab, Tabs } from "@mui/material";
import { Icon } from "@iconify/react";
import { ReactNode, useState } from "react";
import { usePalette } from "@/hooks/usePalette";

export type AnalysisTabId = "report" | "engine" | "moves" | "game" | "settings";

export interface AnalysisTabDef {
  id: AnalysisTabId;
  label: string;
  icon: string;
  show?: boolean;
  tourId?: string;
  /** When false the tab fills the panel height and manages its own scrolling */
  scrollable?: boolean;
  content: ReactNode;
}

interface Props {
  tabs: AnalysisTabDef[];
  defaultTab?: AnalysisTabId;
  activeTab?: AnalysisTabId;
  onActiveTabChange?: (tab: AnalysisTabId) => void;
}

export default function AnalysisPanelTabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onActiveTabChange,
}: Props) {
  const palette = usePalette();
  const visible = tabs.filter((t) => t.show !== false);
  const [internalActiveTab, setInternalActiveTab] = useState<AnalysisTabId>(
    defaultTab ?? visible[0]?.id ?? "report"
  );

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const setActiveTab = (value: AnalysisTabId) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(value);
    }
    onActiveTabChange?.(value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value: AnalysisTabId) => setActiveTab(value)}
        variant="fullWidth"
        sx={{
          flexShrink: 0,
          minHeight: 42,
          mb: 1.25,
          borderBottom: `1px solid ${palette.border}`,
          "& .MuiTabs-indicator": { bgcolor: palette.accent, height: 3 },
          "& .MuiTab-root": {
            minHeight: 42,
            py: 0.75,
            fontSize: { xs: "0.78rem", sm: "0.85rem" },
            fontWeight: 500,
            textTransform: "none",
            color: palette.textMuted,
            gap: 0.5,
            "&.Mui-selected": { color: palette.text, fontWeight: 600 },
          },
        }}
      >
        {visible.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={tab.label}
            icon={
              <Icon
                icon={tab.icon}
                width={16}
                style={{ color: "currentColor" }}
              />
            }
            iconPosition="start"
            {...(tab.tourId ? { "data-tour-id": tab.tourId } : {})}
          />
        ))}
      </Tabs>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {visible.map((tab) => {
          const isActive = activeTab === tab.id;
          const isScrollable = tab.scrollable !== false;

          return (
            <Box
              key={tab.id}
              role="tabpanel"
              hidden={!isActive}
              sx={{
                display: isActive
                  ? isScrollable
                    ? "block"
                    : "flex"
                  : "none",
                flexDirection: isScrollable ? undefined : "column",
                flex: isScrollable ? undefined : 1,
                minHeight: isScrollable ? undefined : 0,
                height: isScrollable ? "100%" : undefined,
                overflowY: isScrollable ? "auto" : "hidden",
                overflowX: "hidden",
                pr: isScrollable ? 0.25 : 0,
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { width: 5 },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: palette.border,
                  borderRadius: 3,
                },
              }}
            >
              {tab.content}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
