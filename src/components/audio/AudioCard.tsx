// src/components/audio/AudioCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio } from 'lucide-react'; 
import type { AudioMetadata } from '@/types/audio';

interface AudioCardProps {
  audio: AudioMetadata;
}

const AudioCard: React.FC<AudioCardProps> = ({ audio }) => {
  // Construct the audio source path relative to the public directory
  const audioSrc = `/data/audio/${audio.filename}`;

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
        <audio controls className="w-full">
          <source src={audioSrc} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
