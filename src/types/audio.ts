// src/types/audio.ts
export interface AudioMetadata {
  id: string;
  title: string;
  description: string;
  filename: string;
  category?: string; // Optional category for grouping
  mimeType?: string;  // Optional: Explicit MIME type (e.g., "audio/wav", "audio/mpeg")
  // duration?: string; // Consider adding if needed for display
}
