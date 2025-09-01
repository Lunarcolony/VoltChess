import NavLink from "@/components/NavLink";
import { Icon } from "@iconify/react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";

const MenuOptions = [
  { text: "Play", icon: "streamline:chess-pawn", href: "/play" },
  { text: "Puzzles", icon: "streamline:puzzle-piece", href: "/puzzles" },
  { text: "Openings", icon: "streamline:book-open", href: "/openings" },
  {
    text: "Analysis",
    icon: "streamline:magnifying-glass-solid",
    href: "/reanalysis",
  },
  {
    text: "Database",
    icon: "streamline:database",
    href: "/database",
  },
  { text: "Thanks", icon: "streamline:heart-2", href: "/thanks" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NavMenu({ open, onClose }: Props) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Toolbar />
      <Box sx={{ width: 250, overflow: "hidden" }}>
        <List>
          {MenuOptions.map(({ text, icon, href }) => (
            <ListItem key={text} disablePadding sx={{ margin: 0.7 }}>
              <NavLink href={href}>
                <ListItemButton onClick={onClose}>
                  <ListItemIcon style={{ paddingLeft: "0.5em" }}>
                    <Icon icon={icon} height="1em" />
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItemButton>
              </NavLink>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
