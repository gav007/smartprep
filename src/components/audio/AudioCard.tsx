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
  // Ensure audio object and filename are valid before constructing the path
  if (!audio || typeof audio.filename !== 'string' || audio.filename.trim() === '') {
    console.error("AudioCard: Invalid or missing audio filename for audio item:", audio);
    // Simplified error display within the card space
    return (
      <Card className="w-full overflow-hidden shadow-lg bg-destructive/10 border-destructive/50 rounded-xl">
        <CardHeader className="flex flex-row items-center gap-3 p-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <CardTitle className="text-destructive text-sm font-semibold">Audio Error</CardTitle>
            <CardDescription className="text-destructive/80 text-xs">
              Invalid audio data.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Construct the audio source path relative to the public directory
  // If audio.filename is "audio2/file.mp3", src will be "/data/audio2/file.mp3"
  // This correctly maps to "public/data/audio2/file.mp3"
  const audioSrc = `/data/${audio.filename}`;

  const getMimeType = (filename?: string, providedMimeType?: string): string => {
    if (providedMimeType) return providedMimeType;
    if (!filename) return 'audio/mpeg'; // Default fallback

    const extension = filename.split('.').pop()?.toLowerCase();
    if (extension === 'wav') return 'audio/wav';
    if (extension === 'mp3') return 'audio/mpeg'; // Explicitly handle .mp3
    if (extension === 'mpg') return 'audio/mpeg'; // Treat .mpg as MPEG audio
    
    console.warn(`AudioCard: Unknown audio extension ".${extension}" for ${filename}. Defaulting to audio/mpeg.`);
    return 'audio/mpeg'; 
  };
  
  const mimeType = getMimeType(audio.filename, audio.mimeType);

  // Uncomment for debugging in browser console:
  // React.useEffect(() => {
  //   console.log(`AudioCard for "${audio.title}": src="${audioSrc}", type="${mimeType}"`);
  // }, [audio.title, audioSrc, mimeType]);

  return (
    <Card className="w-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl bg-card border border-border/50 rounded-xl">
      <CardHeader className="flex flex-row items-start gap-4 p-4 bg-muted/30">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <FileAudio size={24} />
        </div>
        <div>
          <CardTitle className="text-lg font-semibold">{audio.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {audio.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <audio controls className="w-full" preload="metadata"> {/* Added preload="metadata" */}
          <source src={audioSrc} type={mimeType} />
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
