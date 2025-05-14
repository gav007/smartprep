
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
  const getMimeType = (filename?: string, providedMimeType?: string): string => {
    if (providedMimeType && providedMimeType.trim() !== '' && providedMimeType.includes('/')) {
      return providedMimeType;
    }

    if (!filename) return 'audio/mpeg'; 

    const extension = filename.split('.').pop()?.toLowerCase();
    let determinedMimeType = 'audio/mpeg'; 

    switch (extension) {
      case 'wav': determinedMimeType = 'audio/wav'; break;
      case 'mp3': determinedMimeType = 'audio/mpeg'; break;
      case 'mpg': determinedMimeType = 'audio/mpeg'; break; // Treat .mpg as audio/mpeg for audio files
      case 'ogg': determinedMimeType = 'audio/ogg'; break;
      case 'aac': determinedMimeType = 'audio/aac'; break;
      default:
        console.warn(`AudioCard: Unknown audio extension ".${extension}" for file "${filename}". Provided MIME was "${providedMimeType || 'empty'}". Defaulting to "audio/mpeg".`);
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
              Invalid audio data provided to card (e.g. missing filename).
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // This path construction assumes audio.filename is the BARE filename (e.g., "MySong.mp3")
  // and all files are directly in /public/data/audio/
  const audioSrc = `/data/audio/${audio.filename}`;
  const mimeTypeForSourceTag = getMimeType(audio.filename, audio.mimeType);

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audioEl = e.currentTarget;
    let errorDetail = 'Unknown audio error.';
    
    const networkStateValue = (audioEl && typeof audioEl.networkState !== 'undefined') ? audioEl.networkState : 'N/A';
    const readyStateValue = (audioEl && typeof audioEl.readyState !== 'undefined') ? audioEl.readyState : 'N/A';
    const currentSrcInfo = (audioEl && audioEl.currentSrc) ? audioEl.currentSrc : 'N/A';

    if (audioEl && audioEl.error) {
      const mediaError = audioEl.error as MediaError;
      console.error("AudioCard: Full MediaError object on <audio> tag:", mediaError);
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED: errorDetail = 'Playback aborted by user.'; break;
        case MediaError.MEDIA_ERR_NETWORK: errorDetail = 'Network error: Could not fetch audio. Check file path and server status.'; break;
        case MediaError.MEDIA_ERR_DECODE: errorDetail = 'Decoding error: Audio file may be corrupted or in an unsupported format.'; break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetail = 'Source not supported: The audio format or URL might be incorrect, or the file is missing (404).'; break;
        default: errorDetail = `Unknown error code ${mediaError.code}. Message: ${mediaError.message || 'No specific message.'}`;
      }
    } else if (audioEl) {
      errorDetail = 'Audio element error object is null, but onError was triggered. This often indicates the file was not found (404), is inaccessible, or the format is unsupported by all <source> tags.';
    }
    
    console.error(
      `AudioCard Playback Error:\n` +
      `  Filename Prop (from audio.json via AudioLessonsPage): "${audio.filename}"\n` +
      `  Constructed <source src> (URL requested by browser): "${audioSrc}"\n` +
      `  Intended MIME Type for <source>: "${mimeTypeForSourceTag}"\n` +
      `  Browser's currentSrc (what it actually tried to play): "${currentSrcInfo}"\n` +
      `  Error Detail: ${errorDetail}\n` +
      `  Network State (HTMLAudioElement): ${networkStateValue}\n` +
      `  Ready State (HTMLAudioElement): ${readyStateValue}`,
      e // Log the original event object for full context
    );
  };

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
        <audio controls className="w-full" preload="metadata" onError={handleError}>
          <source src={audioSrc} type={mimeTypeForSourceTag} />
          Your browser does not support the audio element. Try updating or using a different browser.
          Audio file: <a href={audioSrc} download>{audio.filename}</a>
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
