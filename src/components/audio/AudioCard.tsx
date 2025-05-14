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
    if (providedMimeType && providedMimeType.trim() !== '' && providedMimeType.includes('/')) {
      return providedMimeType;
    }

    if (!filename) {
      return 'audio/mpeg'; // Default fallback
    }

    const extension = filename.split('.').pop()?.toLowerCase();
    let determinedMimeType = 'audio/mpeg'; 

    switch (extension) {
      case 'wav':
        determinedMimeType = 'audio/wav';
        break;
      case 'mp3':
        determinedMimeType = 'audio/mpeg';
        break;
      case 'mpg': 
        determinedMimeType = 'audio/mpeg'; 
        break;
      case 'ogg':
        determinedMimeType = 'audio/ogg';
        break;
      case 'aac':
        determinedMimeType = 'audio/aac';
        break;
      default:
        console.warn(`AudioCard: Unknown audio extension ".${extension}" for file "${filename}". Provided MIME type was "${providedMimeType || 'empty/missing'}". Defaulting to "audio/mpeg".`);
        break;
    }
    return determinedMimeType;
  };

  if (!audio || typeof audio.filename !== 'string' || audio.filename.trim() === '') {
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
  const mimeTypeForSourceTag = getMimeType(audio.filename, audio.mimeType);

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
            let errorDetail = 'Unknown audio error.';
            if (audioEl.error) {
              console.error("Full audio error object:", audioEl.error);
              switch (audioEl.error.code) {
                case MediaError.MEDIA_ERR_ABORTED: errorDetail = 'Playback aborted by user.'; break;
                case MediaError.MEDIA_ERR_NETWORK: errorDetail = 'Network error caused download to fail.'; break;
                case MediaError.MEDIA_ERR_DECODE: errorDetail = 'Media decoding error (corrupted or unsupported format).'; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetail = 'Audio source not supported (check format/MIME, or file path).'; break;
                default: errorDetail = `Unknown error code: ${audioEl.error.code}. Message: ${audioEl.error.message}`;
              }
            } else {
                 errorDetail = 'Audio element error object is null, but onError was triggered.';
            }
            console.error(
              `AudioCard Playback Error for "${audio.filename}" (src: ${audioSrc}, type: ${mimeTypeForSourceTag}): ${errorDetail}\n` +
              `Network State: ${audioEl.networkState}\n` +
              `Ready State: ${audioEl.readyState}\n`,
              e
            );
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

