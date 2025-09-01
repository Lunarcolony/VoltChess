import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  Paper,
} from "@mui/material";

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  variant?: "spinner" | "skeleton" | "board";
}

export function LoadingSpinner({
  size = 40,
  message = "Loading...",
  variant = "spinner",
}: LoadingSpinnerProps) {
  if (variant === "skeleton") {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={300} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="40%" height={30} />
      </Box>
    );
  }

  if (variant === "board") {
    return (
      <Paper
        elevation={6}
        sx={{
          background: "rgba(40, 44, 52, 0.85)",
          backdropFilter: "blur(8px)",
          border: "1.5px solid #3a3f4b",
          borderRadius: 4,
          p: 3,
          maxWidth: 500,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <CircularProgress
            size={size}
            sx={{
              color: "#3b9ac6",
              "& .MuiCircularProgress-circle": {
                strokeLinecap: "round",
              },
            }}
          />
          <Typography variant="h6" color="text.secondary">
            {message}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 0.5 }}>
            {Array.from({ length: 64 }, (_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width={40}
                height={40}
                sx={{
                  bgcolor: (i + Math.floor(i / 8)) % 2 === 0 ? "#f0d9b5" : "#b58863",
                  opacity: 0.3,
                }}
              />
            ))}
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
        gap: 2,
      }}
    >
      <CircularProgress
        size={size}
        sx={{
          color: "#3b9ac6",
          "& .MuiCircularProgress-circle": {
            strokeLinecap: "round",
          },
        }}
      />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({
  loading,
  children,
  message = "Loading...",
}: LoadingOverlayProps) {
  return (
    <Box sx={{ position: "relative" }}>
      {children}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            borderRadius: "inherit",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              p: 3,
              backgroundColor: "background.paper",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <CircularProgress size={40} sx={{ color: "#3b9ac6" }} />
            <Typography variant="body1" color="text.primary">
              {message}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}