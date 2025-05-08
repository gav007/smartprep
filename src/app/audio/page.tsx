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
        const data: any[] = await response.json(); // Fetch as any[] first for more flexible validation
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid audio metadata format: Expected an array.');
        }
        
        // Filter and group valid audio files
        const groups: GroupedAudio = data.reduce((acc, audioItem) => {
          // Validate each audio item before processing
          if (
            !audioItem ||
            typeof audioItem.id !== 'string' ||
            typeof audioItem.title !== 'string' ||
            typeof audioItem.description !== 'string' ||
            typeof audioItem.filename !== 'string' ||
            audioItem.filename.trim() === ''
          ) {
            console.warn('AudioLessonsPage: Skipping invalid audio entry in audio.json:', audioItem);
            return acc; // Skip this invalid item
          }

          // Cast to AudioMetadata after validation
          const validAudioItem = audioItem as AudioMetadata;
          const category = validAudioItem.category || 'General'; // Default category if none provided
          
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(validAudioItem);
          return acc;
        }, {} as GroupedAudio);

        setGroupedAudioFiles(groups);
      } catch (err) {
        console.error("Error in fetchAudioMetadata:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while loading audio metadata.');
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
            {error} Please try again later or check the console for more details.
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

      {categories.length === 0 && !loading ? ( // Check !loading to avoid showing "No lessons" during initial load
        <p className="text-center text-muted-foreground">No audio lessons available at the moment. Please check back later.</p>
      ) : (
        <div className="space-y-12">
          {categories.sort().map((category) => ( // Sort categories alphabetically for consistent order
            <section key={category}>
              <h2 className="text-2xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
                <ListMusic className="h-6 w-6 text-accent" /> 
                {category} Audio
              </h2>
              {groupedAudioFiles[category].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedAudioFiles[category].map((audio) => (
                    <AudioCard key={audio.id} audio={audio} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No audio files found in this category.</p>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
