import { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
} from "@mui/material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            p: 4,
          }}
        >
          <Paper
            elevation={6}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              textAlign: "center",
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Something went wrong</AlertTitle>
              An unexpected error occurred in VoltChess. Don't worry, your data
              is safe!
            </Alert>

            <Typography variant="h5" gutterBottom>
              ⚡ Oops! Chess Engine Malfunction
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We encountered an unexpected error. This might be due to:
            </Typography>

            <Box sx={{ textAlign: "left", mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                • Browser compatibility issues
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Network connectivity problems
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Memory limitations with large chess games
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="contained"
                onClick={this.handleReset}
                sx={{
                  backgroundColor: "#3b9ac6",
                  "&:hover": { backgroundColor: "#3385ad" },
                }}
              >
                🔄 Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                color="primary"
              >
                🏠 Reload Page
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <Box sx={{ mt: 4, textAlign: "left" }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Debug Information:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#f5f5f5",
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                  >
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
