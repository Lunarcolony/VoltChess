import { FormControl, Button, Box, Typography, Grid2 as Grid, Alert } from "@mui/material";
import { Icon } from "@iconify/react";
import React, { useState, useRef } from "react";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
}

export default function ImageInput({ onSelect }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Clear previous errors
    setError(null);

    // Create URL for preview
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);

    // Read file for processing
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (_imageData: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // For now, create a demo position from the starting position
      // In a real implementation, this would use computer vision to detect the chess position
      const demoPgn = `[Event "Image Upload Demo"]
[Site "VoltChess"]
[Date "2024.01.01"]
[Round "-"]
[White "Player"]
[Black "Player"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 *`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      onSelect(demoPgn, true);
    } catch (err) {
      setError('Failed to process image. Please try a different image or make sure the chess board is clearly visible.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetImage = () => {
    setSelectedImage(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FormControl fullWidth>
      <Grid container spacing={2} alignItems="center" justifyContent="center">
        <Grid size={12}>
          <Typography variant="h6" align="center" gutterBottom>
            Upload Chess Position Image
          </Typography>
          <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
            Take a photo or upload an image of a chess position to analyze
          </Typography>
        </Grid>

        {!selectedImage ? (
          <Grid size={12}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={handleUploadClick}
            >
              <Icon icon="material-symbols:cloud-upload" width={48} height={48} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Click to upload chess position image
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Supports PNG, JPG, JPEG formats
              </Typography>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Grid>
        ) : (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedImage}
                alt="Chess position"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid #ccc',
                }}
              />
              <Box sx={{ mt: 2 }}>
                {isProcessing ? (
                  <Typography variant="body2" color="primary">
                    <Icon icon="eos-icons:loading" width={20} height={20} style={{ marginRight: 8 }} />
                    Processing image... This may take a moment.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      onClick={resetImage}
                      startIcon={<Icon icon="material-symbols:refresh" />}
                    >
                      Try Different Image
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => processImage(selectedImage)}
                      startIcon={<Icon icon="material-symbols:smart-toy" />}
                    >
                      Analyze Position
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        )}

        {error && (
          <Grid size={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        <Grid size={12}>
          <Typography variant="body2" align="center" color="textSecondary" sx={{ mt: 2 }}>
            💡 Tips: Ensure good lighting, clear piece visibility, and minimal background clutter for best results
          </Typography>
        </Grid>
      </Grid>
    </FormControl>
  );
}