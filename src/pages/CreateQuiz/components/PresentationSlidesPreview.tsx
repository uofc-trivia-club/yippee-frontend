import { Box, Card, CardContent, Divider, Typography, useTheme } from "@mui/material";

import { PresentationSlideForm } from "../createQuizTypes";

interface PresentationSlidesPreviewProps {
  slides: PresentationSlideForm[];
}

export default function PresentationSlidesPreview({ slides }: PresentationSlidesPreviewProps) {
  const theme = useTheme();

  if (slides.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Presentation Slides
      </Typography>
      {slides.map((slide, slideIndex) => (
        <Card
          key={slide.id}
          sx={{
            mb: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Slide {slideIndex + 1}
            </Typography>
            {slide.title && (
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {slide.title}
              </Typography>
            )}
            {slide.content && (
              <Typography variant="body1" sx={{ mb: slide.imageUrl ? 1.5 : 0 }}>
                {slide.content}
              </Typography>
            )}
            {slide.imageUrl && (
              <Box
                component="img"
                src={slide.imageUrl}
                alt={`Slide ${slideIndex + 1}`}
                sx={{
                  width: '100%',
                  maxWidth: 520,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: '0 8px 18px rgba(0,0,0,0.10)',
                  objectFit: 'cover',
                }}
              />
            )}
          </CardContent>
        </Card>
      ))}
      <Divider sx={{ mt: 1, mb: 3 }} />
    </Box>
  );
}