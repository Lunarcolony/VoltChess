import { Link as MuiLink } from "@mui/material";
import Link from "@/components/Link";
import { ReactNode } from "react";

export default function NavLink({
  href,
  children,
  fullWidth = true,
}: {
  href: string;
  children: ReactNode;
  /** false for inline header links (Sign in) so they don't stretch across the bar */
  fullWidth?: boolean;
}) {
  return (
    <MuiLink
      component={Link}
      href={href}
      underline="none"
      color="inherit"
      sx={{
        display: fullWidth ? "block" : "inline-flex",
        width: fullWidth ? "100%" : "auto",
        flexShrink: fullWidth ? undefined : 0,
      }}
    >
      {children}
    </MuiLink>
  );
}
