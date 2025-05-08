
// src/app/audio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AudioCard from '@/components/audio/AudioCard';
import type { AudioMetadata } from '@/types/audio';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Podcast, Network, BookOpen } from 'lucide-react';

interface GroupedAudio {
  [category: string]: AudioMetadata[];
}

// Define constants for category names to avoid typos
const CATEGORY_APPLIED_NETWORKING = "Applied Networking";
const CATEGORY_CCNA = "CCNA";

export default function AudioLessonsPage() {
  const [groupedAudioFiles, setGroupedAudioFiles] = useState<GroupedAudio>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudioMetadata() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/data/audio.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch audio metadata: ${response.statusText} (status: ${response.status})`);
        }
        const data: any[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Invalid audio metadata format: Expected an array.');
        }

        const groups: GroupedAudio = {
          [CATEGORY_APPLIED_NETWORKING]: [],
          [CATEGORY_CCNA]: [],
        };

        data.forEach((audioItem) => {
          // Validate essential fields for an AudioMetadata object
          if (
            !audioItem ||
            typeof audioItem.id !== 'string' ||
            typeof audioItem.title !== 'string' ||
            // audioItem.description can be undefined as per AudioMetadata type
            typeof audioItem.filename !== 'string' ||
            audioItem.filename.trim() === ''
            // category and mimeType are optional in AudioMetadata, but good to have in JSON
          ) {
            console.warn('AudioLessonsPage: Skipping invalid audio entry in audio.json:', audioItem);
            return; // Skip this invalid entry
          }
          
          const validAudioItem = audioItem as AudioMetadata; // Cast after basic validation

          // Primarily use the 'category' field from audio.json
          if (validAudioItem.category === CATEGORY_CCNA) {
            groups[CATEGORY_CCNA].push(validAudioItem);
          } else if (validAudioItem.category === CATEGORY_APPLIED_NETWORKING) {
            groups[CATEGORY_APPLIED_NETWORKING].push(validAudioItem);
          } else {
            // Fallback: If category field is missing or not one of the known ones,
            // try to infer from filename (less reliable).
            if (validAudioItem.filename.toLowerCase().includes('ccna')) {
              groups[CATEGORY_CCNA].push(validAudioItem);
            } else {
              groups[CATEGORY_APPLIED_NETWORKING].push(validAudioItem);
            }
            console.warn(`Audio item "${validAudioItem.title}" missing or has unrecognized category. Assigned based on filename.`);
          }
        });
        
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
  
  const categoriesToDisplay = [CATEGORY_APPLIED_NETWORKING, CATEGORY_CCNA];

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

      {categoriesToDisplay.every(cat => !groupedAudioFiles[cat] || groupedAudioFiles[cat].length === 0) && !loading ? (
         <div className="text-center py-10">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-xl text-muted-foreground">No audio lessons available at the moment.</p>
            <p className="text-sm text-muted-foreground/80">Please check back later or ensure audio files are correctly configured in <code className="bg-muted px-1 py-0.5 rounded-sm">public/data/audio.json</code> and present in <code className="bg-muted px-1 py-0.5 rounded-sm">public/data/audio/</code>.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categoriesToDisplay.map((category) => {
            const filesInCategory = groupedAudioFiles[category] || [];
            if (filesInCategory.length === 0) return null;

            const IconComponent = category === CATEGORY_CCNA ? BookOpen : Network;

            return (
              <section key={category}>
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
                  <IconComponent className="h-6 w-6 text-accent" />
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filesInCategory.map((audio) => (
                    <AudioCard key={audio.id} audio={audio} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
