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
    // 1. Prioritize explicitly provided MIME type from audio.json if it's a non-empty string
    if (providedMimeType && providedMimeType.trim() !== '' && providedMimeType.includes('/')) {
      console.log(`AudioCard: Using provided MIME type "${providedMimeType}" for "${filename || 'unknown file'}".`);
      return providedMimeType;
    }

    // 2. If no valid providedMimeType, derive from filename
    if (!filename) {
      console.warn("AudioCard: getMimeType called with no filename and no valid providedMimeType. Defaulting to audio/mpeg for safety.");
      return 'audio/mpeg'; // Default fallback
    }

    const extension = filename.split('.').pop()?.toLowerCase();
    let determinedMimeType = 'audio/mpeg'; // Default if extension is unknown or not handled

    switch (extension) {
      case 'wav':
        determinedMimeType = 'audio/wav';
        break;
      case 'mp3':
        determinedMimeType = 'audio/mpeg'; // Standard for MP3
        break;
      case 'mpg': 
        // MPG can be video or audio. Assuming audio/mpeg for SmartPrep context, but this can be risky.
        // It's better if audio.json explicitly provides 'audio/mpeg' for these if they are audio.
        determinedMimeType = 'audio/mpeg'; 
        console.log(`AudioCard: File "${filename}" has .mpg extension. Assuming 'audio/mpeg'. Explicit mimeType in JSON is preferred for .mpg.`);
        break;
      case 'ogg':
        determinedMimeType = 'audio/ogg';
        break;
      case 'aac':
        determinedMimeType = 'audio/aac';
        break;
      default:
        console.warn(`AudioCard: Unknown audio extension ".${extension}" for file "${filename}". Provided MIME type was "${providedMimeType || 'empty/missing'}". Defaulting to "audio/mpeg".`);
        // Keep default 'audio/mpeg'
        break;
    }
    console.log(`AudioCard: Determined MIME type "${determinedMimeType}" for extension ".${extension}" of file "${filename}" (as providedMimeType was invalid or missing).`);
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
              Invalid audio data: Filename is missing.
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
  console.log(
    `AudioCard Rendering: 
    Title: "${audio.title}", 
    Filename: "${audio.filename}", 
    Category: "${audio.category || 'N/A'}",
    Constructed Src Path: "${audioSrc}", 
    MIME Type from JSON: "${audio.mimeType || 'Not provided'}",
    Final MIME Type for <source> tag: "${mimeTypeForSourceTag}"`
  );

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
        <audio controls className="w-full" preload="metadata"
          onError={(e) => {
            const audioEl = e.target as HTMLAudioElement;
            let errorDetail = '';
            if (audioEl.error) {
              switch (audioEl.error.code) {
                case MediaError.MEDIA_ERR_ABORTED: errorDetail = 'Playback aborted by user.'; break;
                case MediaError.MEDIA_ERR_NETWORK: errorDetail = 'Network error caused download to fail.'; break;
                case MediaError.MEDIA_ERR_DECODE: errorDetail = 'Media decoding error (corrupted or unsupported format).'; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetail = 'Audio source not supported (check format/MIME, or file path).'; break;
                default: errorDetail = 'Unknown audio error.';
              }
            }
            console.error(`AudioCard Playback Error for "${audio.filename}" (src: ${audioSrc}, type: ${mimeTypeForSourceTag}): ${errorDetail}`, e);
          }}
        >
          <source src={audioSrc} type={mimeTypeForSourceTag} />
          Your browser does not support the audio element. Try updating or using a different browser.
          Audio file: <a href={audioSrc} download>{audio.filename}</a>
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
