
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

    if (!filename) return 'audio/mpeg'; // Default if no filename

    const extension = filename.split('.').pop()?.toLowerCase();
    let determinedMimeType = 'audio/mpeg'; // Default for unknown or .mp3

    switch (extension) {
      case 'wav': determinedMimeType = 'audio/wav'; break;
      case 'mp3': determinedMimeType = 'audio/mpeg'; break;
      case 'mpg': determinedMimeType = 'video/mpeg'; break; // MPG is a video container
      case 'ogg': determinedMimeType = 'audio/ogg'; break;
      case 'aac': determinedMimeType = 'audio/aac'; break;
      default:
        // Log a warning if the extension is unknown but keep default
        console.warn(`AUDIO_CARD_DEBUG: Unknown audio extension ".${extension}" for file "${filename}". Provided MIME was "${providedMimeType || 'empty'}". Defaulting to "audio/mpeg".`);
        break;
    }
    return determinedMimeType;
  };

  if (!audio || typeof audio.filename !== 'string' || audio.filename.trim() === '') {
    // This card is rendered if the audio metadata itself is invalid (e.g., missing filename in audio.json)
    return (
      <Card className="w-full overflow-hidden shadow-lg bg-destructive/10 border-destructive/50 rounded-xl">
        <CardHeader className="flex flex-row items-center gap-3 p-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-destructive text-sm font-semibold">Audio Data Error</CardTitle>
            <CardDescription className="text-destructive/80 text-xs">
              Invalid audio metadata. Filename missing/invalid for title: "{audio?.title || 'Unknown'}". Check audio.json.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Use encodeURIComponent for the filename part of the URL to handle special characters if any were missed in manual cleaning.
  const audioSrc = `/data/audio/${encodeURIComponent(audio.filename)}`;
  const mimeTypeForSourceTag = getMimeType(audio.filename, audio.mimeType);

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const audioEl = e.currentTarget;
    let errorDetail = 'Unknown audio error.';
    
    const networkStateValue = (audioEl && typeof audioEl.networkState !== 'undefined') ? audioEl.networkState : 'N/A';
    const readyStateValue = (audioEl && typeof audioEl.readyState !== 'undefined') ? audioEl.readyState : 'N/A';
    const browserCurrentSrc = (audioEl && audioEl.currentSrc) ? audioEl.currentSrc : 'N/A (or path not resolved by browser)';

    if (audioEl && audioEl.error) {
      const mediaError = audioEl.error as MediaError; // Type assertion
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED: errorDetail = 'Playback aborted by user.'; break;
        case MediaError.MEDIA_ERR_NETWORK: errorDetail = 'Network error. The browser could not fetch the audio file.'; break;
        case MediaError.MEDIA_ERR_DECODE: errorDetail = 'Decoding error: Audio file may be corrupted or in an unsupported format.'; break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetail = 'Source not supported: The audio format might be incorrect, or the browser cannot play this format.'; break;
        default: errorDetail = `MediaError code ${mediaError.code}. Message: ${mediaError.message || 'No specific message.'}`;
      }
    } else if (networkStateValue === 3 /* HTMLMediaElement.NETWORK_NO_SOURCE */) {
        errorDetail = 'Audio element error object is null, and networkState is NETWORK_NO_SOURCE (3). This strongly indicates the file was NOT FOUND (404) at the specified URL, or is inaccessible due to server/permissions issues. Please verify the file exists on the server and the path is correct.';
    } else {
        errorDetail = 'Audio element error object is null, but onError was triggered. Check browser console for more specific network errors (like 404).';
    }
    
    console.error(
      `AUDIO_CARD_DEBUG: Playback Error Encountered\n` +
      `  > Filename Prop (from audio.json via AudioLessonsPage): "${audio.filename}"\n` + // This is the bare filename expected from audio.json
      `  > Constructed <source src> (URL requested by browser): "${audioSrc}"\n` + // This is the URL the browser attempts to load
      `  > Intended MIME Type for <source>: "${mimeTypeForSourceTag}"\n` +
      `  > Browser's Resolved currentSrc (what it actually tried to load): "${browserCurrentSrc}"\n` +
      `  > HTMLAudioElement Network State: ${networkStateValue}\n` +
      `  > HTMLAudioElement Ready State: ${readyStateValue}\n` +
      `  > Error Detail: ${errorDetail}`,
      e 
    );
  };

  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-card border border-border/50 rounded-xl">
      <CardHeader className="flex flex-row items-start gap-4 p-4 bg-muted/30">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <FileAudio size={24} />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{audio.title || audio.filename}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {audio.description || `Audio file: ${audio.filename}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {(mimeTypeForSourceTag === 'video/mpeg' || audio.filename.toLowerCase().endsWith('.mpg')) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Note: This is an MPG file. Audio playback depends on your browser's support for this format.
          </p>
        )}
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

