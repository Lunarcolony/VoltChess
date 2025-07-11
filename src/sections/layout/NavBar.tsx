 import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useEffect, useState } from "react";
import NavMenu from "./NavMenu";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import NavLink from "@/components/NavLink";
import Image from "next/image";
import { styled } from "@mui/material/styles";
import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CssBaseline,
} from '@mui/material';


const drawerWidth = 220;
interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

// Styled component to make the link look like a button
const StyledIconButtonLink = styled("a")({
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none", // Remove underline from link
    "&:hover": {
        cursor: "pointer", // Change cursor on hover
    },
});

export default function NavBar({ darkMode, switchDarkMode }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
      setDrawerOpen(false);
  }, [router.pathname]);

  return (
    <Box sx={{ flexGrow: 1, display: "flex" }}>
      <AppBar
        position="static"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: darkMode ? "#19191c" : "white",
          color: darkMode ? "white" : "black",
        }}
        enableColorOnDark
      >
        <Toolbar variant="dense">
         

          <Image
            src="/favicon-32x32.png"
            alt="VoltChess logo"
            width={70}
            height={70}
          />

          <NavLink href="/">
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                ml: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              VoltChess
            </Typography>
          </NavLink>
          


          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            sx={{ mr: "min(0.5vw, 0.6rem)", padding: 1, my: 1 }}
            onClick={() => setDrawerOpen((val) => !val)}
          >
            <Icon icon="mdi:menu" />
          </IconButton>
        </Toolbar>
      </AppBar>
      <NavMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}



//<StyledIconButtonLink
//    href="https://discord.gg/Yr99abAcUr"
//    target="_blank"
//    rel="noopener noreferrer">

//    <IconButton color="inherit" component="span">
//        <Icon icon="ri:discord-fill" />
//    </IconButton>
//</StyledIconButtonLink>