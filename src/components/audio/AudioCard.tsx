// src/components/audio/AudioCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio, AlertTriangle } from 'lucide-react';
import type { AudioMetadata } from '@/types/audio';

interface AudioCardProps {
  audio: AudioMetadata;
}

const AudioCard: React.FC<AudioCardProps> = ({ audio }) => {
  // Helper function to determine MIME type
  const getMimeType = (filename?: string, providedMimeType?: string): string => {
    // 1. Prioritize explicitly provided MIME type from audio.json
    if (providedMimeType && providedMimeType.trim() !== '') {
      console.log(`AudioCard: Using provided MIME type "${providedMimeType}" for "${filename || 'unknown file'}".`);
      return providedMimeType;
    }

    // 2. If no providedMimeType, derive from filename
    if (!filename) {
      console.warn("AudioCard: getMimeType called with no filename and no providedMimeType. Defaulting to audio/mpeg.");
      return 'audio/mpeg'; // Default fallback
    }

    const extension = filename.split('.').pop()?.toLowerCase();
    let determinedMimeType = 'audio/mpeg'; // Default if extension is unknown or not handled

    switch (extension) {
      case 'wav':
        determinedMimeType = 'audio/wav';
        break;
      case 'mp3':
      case 'mpg': // Handling .mpg as audio/mpeg as per previous requests
        determinedMimeType = 'audio/mpeg';
        break;
      case 'ogg':
        determinedMimeType = 'audio/ogg';
        break;
      case 'aac':
        determinedMimeType = 'audio/aac';
        break;
      // Add more cases as needed for other audio formats
      default:
        console.warn(`AudioCard: Unknown audio extension ".${extension}" for file "${filename}". Defaulting to "audio/mpeg".`);
        // Keep default 'audio/mpeg'
        break;
    }
    console.log(`AudioCard: Determined MIME type "${determinedMimeType}" for extension ".${extension}" of file "${filename}" (as providedMimeType was empty).`);
    return determinedMimeType;
  };

  // Validate that essential audio data (especially filename) is present
  if (!audio || typeof audio.filename !== 'string' || audio.filename.trim() === '') {
    console.error("AudioCard: Invalid or missing audio filename for audio item:", audio);
    return (
      <Card className="w-full overflow-hidden shadow-lg bg-destructive/10 border-destructive/50 rounded-xl">
        <CardHeader className="flex flex-row items-center gap-3 p-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-destructive text-sm font-semibold">Audio Error</CardTitle>
            <CardDescription className="text-destructive/80 text-xs">
              Invalid audio data provided. Filename is missing.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const audioSrc = `/data/audio/${audio.filename}`;
  // Use the getMimeType helper, passing filename and the mimeType from JSON
  const mimeTypeForSourceTag = getMimeType(audio.filename, audio.mimeType);

  // Detailed console log for debugging what's being passed to the <audio> element
  console.log(`AudioCard rendering: Title: "${audio.title}", File: "${audio.filename}", Src Path: "${audioSrc}", Final MIME Type for <source>: "${mimeTypeForSourceTag}" (Original from JSON: "${audio.mimeType || 'Not provided'}")`);

  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-card border border-border/50 rounded-xl">
      <CardHeader className="flex flex-row items-start gap-4 p-4 bg-muted/30">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <FileAudio size={24} />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{audio.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {audio.description || `Audio file: ${audio.filename}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <audio controls className="w-full" preload="metadata">
          <source src={audioSrc} type={mimeTypeForSourceTag} />
          Your browser does not support the audio element. Try updating your browser or using a different one.
          Audio file: <a href={audioSrc} download>{audio.filename}</a>
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
