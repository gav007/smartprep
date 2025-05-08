// src/app/audio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AudioCard from '@/components/audio/AudioCard';
import type { AudioMetadata } from '@/types/audio';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Podcast, ListMusic } from 'lucide-react'; 

interface GroupedAudio {
  [category: string]: AudioMetadata[];
}

export default function AudioLessonsPage() {
  const [groupedAudioFiles, setGroupedAudioFiles] = useState<GroupedAudio>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudioMetadata() {
      try {
        const response = await fetch('/data/audio.json'); 
        if (!response.ok) {
          throw new Error(`Failed to fetch audio metadata: ${response.statusText} (status: ${response.status})`);
        }
        const data: AudioMetadata[] = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid audio metadata format: Expected an array.');
        }
        
        // Group audio files by category
        const groups: GroupedAudio = data.reduce((acc, audio) => {
          const category = audio.category || 'General'; // Default category if none provided
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(audio);
          return acc;
        }, {} as GroupedAudio);

        setGroupedAudioFiles(groups);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchAudioMetadata();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Audio Lessons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Audio</AlertTitle>
          <AlertDescription>
            {error} Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const categories = Object.keys(groupedAudioFiles);

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2">
          <Podcast className="h-8 w-8 text-primary" />
          Audio Lessons
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Listen to educational audio clips on networking and electronics topics, grouped by category.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">No audio lessons available at the moment.</p>
      ) : (
        <div className="space-y-12">
          {categories.sort().map((category) => ( // Sort categories alphabetically for consistent order
            <section key={category}>
              <h2 className="text-2xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
                <ListMusic className="h-6 w-6 text-accent" /> 
                {category} Audio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedAudioFiles[category].map((audio) => (
                  <AudioCard key={audio.id} audio={audio} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
