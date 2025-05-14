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
      console.log("AudioLessonsPage: Starting to fetch audio metadata...");
      try {
        const response = await fetch('/data/audio.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch audio metadata from /data/audio.json: ${response.statusText} (status: ${response.status})`);
        }
        const rawAudioData: any[] = await response.json();
        console.log("AudioLessonsPage: Successfully fetched /data/audio.json. Raw data length:", rawAudioData?.length);

        if (!Array.isArray(rawAudioData)) {
          throw new Error('Invalid audio metadata format: Expected an array from audio.json.');
        }
        
        const validatedAndProcessedAudio = rawAudioData.map((item: any, index: number): AudioMetadata | null => {
          const itemTitle = item?.title || `(No Title at index ${index})`;
          const itemFilename = item?.filename;

          if (
            !item ||
            typeof item.id !== 'string' ||
            typeof item.title !== 'string' ||
            typeof itemFilename !== 'string' ||
            itemFilename.trim() === '' ||
            (item.category && typeof item.category !== 'string') || // Category is optional, but if present, must be string
            (item.mimeType && typeof item.mimeType !== 'string')
          ) {
            console.warn(`AudioLessonsPage: Skipping invalid audio entry at index ${index}. Title: "${itemTitle}", Filename: "${itemFilename || 'MISSING'}". Reason: Missing/invalid essential fields. Item:`, item);
            return null;
          }

          let finalFilename = item.filename;
          let finalCategory = item.category;

          // Determine category if not explicitly provided or if it's ambiguous
          if (!finalCategory && item.filename) {
            if (item.filename.toLowerCase().startsWith('ccna')) {
              finalCategory = CATEGORY_CCNA;
            } else {
              finalCategory = CATEGORY_APPLIED_NETWORKING; // Default fallback
            }
          } else if (finalCategory !== CATEGORY_CCNA && finalCategory !== CATEGORY_APPLIED_NETWORKING && item.filename) {
             // If category is something else but filename indicates CCNA
            if (item.filename.toLowerCase().startsWith('ccna')) {
                finalCategory = CATEGORY_CCNA;
            }
            // Otherwise, keep the provided category if it's not one of the two main ones but let it fall into applied or default
          }


          // Prepend 'audio2/' to filename if it's a CCNA track and not already prefixed
          if (finalCategory === CATEGORY_CCNA && finalFilename && !finalFilename.startsWith('audio2/')) {
            finalFilename = `audio2/${finalFilename}`;
            console.log(`AudioLessonsPage: Prefixed CCNA file: ${item.filename} -> ${finalFilename}`);
          }
          
          return {
            id: item.id,
            title: item.title,
            description: item.description || '', // Ensure description is always a string
            filename: finalFilename,
            category: finalCategory || CATEGORY_APPLIED_NETWORKING, // Default to Applied if category couldn't be determined
            mimeType: item.mimeType,
          };
        }).filter((item): item is AudioMetadata => item !== null);


        const groups: GroupedAudio = {
          [CATEGORY_APPLIED_NETWORKING]: [],
          [CATEGORY_CCNA]: [],
        };

        validatedAndProcessedAudio.forEach(audioItem => {
          if (audioItem.category === CATEGORY_CCNA) {
            groups[CATEGORY_CCNA].push(audioItem);
          } else { // Everything else, including explicitly Applied Networking or default/fallback
            groups[CATEGORY_APPLIED_NETWORKING].push(audioItem);
          }
        });
        
        console.log(`AudioLessonsPage: Processed and grouped audio files. Applied: ${groups[CATEGORY_APPLIED_NETWORKING].length}, CCNA: ${groups[CATEGORY_CCNA].length}`);
        setGroupedAudioFiles(groups);

      } catch (err) {
        console.error("AudioLessonsPage: Error in fetchAudioMetadata:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while loading audio metadata.');
      } finally {
        setLoading(false);
         console.log("AudioLessonsPage: Finished fetching and processing audio metadata.");
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
            {error} Please try again later or check the console for more details. Ensure <code>public/data/audio.json</code> is correctly formatted and accessible, and all listed audio files exist in their correct subdirectories (<code>public/data/audio/</code> or <code>public/data/audio2/</code>).
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
            <p className="text-sm text-muted-foreground/80">Please check back later or ensure audio files are correctly configured in <code className="bg-muted px-1 py-0.5 rounded-sm">public/data/audio.json</code> and present in their respective folders: <code className="bg-muted px-1 py-0.5 rounded-sm">public/data/audio/</code> for Applied Networking and <code className="bg-muted px-1 py-0.5 rounded-sm">public/data/audio2/</code> for CCNA.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categoriesToDisplay.map((category) => {
            const filesInCategory = groupedAudioFiles[category] || [];
            const IconComponent = category === CATEGORY_CCNA ? BookOpen : Network;

            return (
              <section key={category}>
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
                  <IconComponent className="h-6 w-6 text-accent" />
                  {category} ({filesInCategory.length} {filesInCategory.length === 1 ? 'lesson' : 'lessons'})
                </h2>
                {filesInCategory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filesInCategory.map((audio) => (
                      <AudioCard key={audio.id} audio={audio} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No audio lessons found for the &quot;{category}&quot; category in <code>audio.json</code> or they failed validation.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
