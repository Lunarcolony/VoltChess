import { Link as MuiLink } from "@mui/material";
import Link from "@/components/Link";
import { ReactNode } from "react";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <MuiLink
      component={Link}
      href={href}
      underline="none"
      color="inherit"
      sx={{ width: "100%" }}
    >
      {children}
    </MuiLink>
  );
}
