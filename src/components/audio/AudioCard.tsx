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
      case 'mpg': // Treat .mpg as audio/mpeg for audio files
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

  const audioSrc = `/data/${audio.filename}`; // The filename should now include 'audio2/' prefix if applicable
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
            {audio.description || `Audio file: ${audio.filename.replace(/^audio2\//, '')}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <audio controls className="w-full" preload="metadata"
          onError={(e) => {
            const targetEl = e.target as HTMLAudioElement | HTMLSourceElement;
            let errorDetail = 'Unknown audio error.';
            let networkStateInfo = 'N/A';
            let readyStateInfo = 'N/A';
            let currentSrcInfo = 'N/A';
            let targetNodeName = targetEl?.nodeName || 'Unknown Target';

            // Attempt to get error from the <audio> element itself, which is e.currentTarget
            const audioTag = e.currentTarget as HTMLAudioElement;

            if (audioTag && audioTag.error) {
              const mediaError = audioTag.error as MediaError;
              console.error("Full audio error object on <audio> tag:", mediaError);
              switch (mediaError.code) {
                case MediaError.MEDIA_ERR_ABORTED: errorDetail = 'Playback aborted by user.'; break;
                case MediaError.MEDIA_ERR_NETWORK: errorDetail = 'Network error caused download to fail.'; break;
                case MediaError.MEDIA_ERR_DECODE: errorDetail = 'Media decoding error (corrupted or unsupported format).'; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorDetail = 'Audio source not supported (check format/MIME, or file path). This often means the file was not found (404) or the server refused the connection.'; break;
                default: errorDetail = `Unknown error code on <audio> tag: ${mediaError.code}. Message: ${mediaError.message || 'No message'}`;
              }
            } else if (targetEl && targetEl.nodeName === 'SOURCE' && (targetEl as HTMLSourceElement).msMatchesSelector !== undefined ) { // Heuristic for source element if audio.error is null
                 errorDetail = 'Error on <source> element. The browser likely could not load or understand this specific source.';
            } else {
                 errorDetail = 'MediaError object is null on <audio> tag, but onError was triggered. Source likely not found, inaccessible, or of an unsupported type for all provided sources.';
            }
            
            if (audioTag) {
              networkStateInfo = String(audioTag.networkState);
              readyStateInfo = String(audioTag.readyState);
              currentSrcInfo = audioTag.currentSrc || 'N/A'; // What the browser is actually trying to play
            }
            
            console.error(
              `AudioCard Playback Error for "${audio.filename}"\n` +
              `  Attempted Src (constructed by AudioCard): ${audioSrc}\n` +
              `  MIME Type (for <source>): ${mimeTypeForSourceTag}\n` +
              `  Browser's currentSrc: ${currentSrcInfo}\n` +
              `  Error Detail: ${errorDetail}\n` +
              `  Event Target Node: ${targetNodeName}\n`+
              `  Network State (Audio Element): ${networkStateInfo}\n` +
              `  Ready State (Audio Element): ${readyStateInfo}`,
              e // Log the original event object
            );
          }}
        >
          <source src={audioSrc} type={mimeTypeForSourceTag} />
          Your browser does not support the audio element. Try updating or using a different browser.
          Audio file: <a href={audioSrc} download>{audio.filename.replace(/^audio2\//, '')}</a>
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
