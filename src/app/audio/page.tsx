
// src/app/audio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AudioCard from '@/components/audio/AudioCard';
import type { AudioMetadata } from '@/types/audio';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Podcast, Network, BookOpen, Database } from 'lucide-react'; // Added Database icon

interface GroupedAudio {
  [category: string]: AudioMetadata[];
}

// Define constants for category names to avoid typos
const CATEGORY_APPLIED_NETWORKING = "Applied Networking";
const CATEGORY_CCNA = "CCNA";
const CATEGORY_DATABASE_AUDIO = "Databases and Data Analysis"; // Display name for the new section
const JSON_CATEGORY_DATABASE = "Database Audio"; // Category key as in audio.json

export default function AudioLessonsPage() {
  const [groupedAudioFiles, setGroupedAudioFiles] = useState<GroupedAudio>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAudioMetadata() {
      setLoading(true);
      setError(null);
      console.log("AudioLessonsPage: Starting to fetch audio metadata from /data/audio.json...");
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
            (item.category && typeof item.category !== 'string') ||
            (item.mimeType && typeof item.mimeType !== 'string')
          ) {
            console.warn(`AudioLessonsPage: Skipping invalid audio entry at index ${index}. Title: "${itemTitle}", Filename: "${itemFilename || 'MISSING'}". Reason: Missing/invalid essential fields. Item:`, item);
            return null;
          }

          const bareFilename = item.filename.split('/').pop();
          
          console.log(`AudioLessonsPage: Processing item #${index} - Original JSON filename: "${item.filename}", Computed bareFilename for AudioCard: "${bareFilename}"`);

          let finalCategory = item.category;

          // Explicitly handle known categories from JSON first
          if (item.category === CATEGORY_CCNA) {
            finalCategory = CATEGORY_CCNA;
          } else if (item.category === JSON_CATEGORY_DATABASE) {
            finalCategory = JSON_CATEGORY_DATABASE; // Use the key from JSON for internal grouping
          } else if (item.category === CATEGORY_APPLIED_NETWORKING) {
            finalCategory = CATEGORY_APPLIED_NETWORKING;
          }
          // Fallback derivation if category is missing or not one of the explicit ones above
          else if (!finalCategory && bareFilename) {
            if (bareFilename.toLowerCase().startsWith('ccna')) {
              finalCategory = CATEGORY_CCNA;
            } else if (bareFilename.toLowerCase().includes('database')) {
              finalCategory = JSON_CATEGORY_DATABASE;
            } else {
              finalCategory = CATEGORY_APPLIED_NETWORKING; 
            }
          } else if (!finalCategory) { // Absolute fallback if category is completely missing
            finalCategory = CATEGORY_APPLIED_NETWORKING;
          }
          // If item.category was something else unknown, it defaults to finalCategory (which might be Applied Networking if not caught above)
          
          return {
            id: item.id,
            title: item.title,
            description: item.description || '', 
            filename: bareFilename, 
            category: finalCategory, // This will be used for grouping
            mimeType: item.mimeType,
          };
        }).filter((item): item is AudioMetadata => item !== null);


        const groups: GroupedAudio = {
          [CATEGORY_APPLIED_NETWORKING]: [],
          [CATEGORY_CCNA]: [],
          [CATEGORY_DATABASE_AUDIO]: [], // Initialize the new group for display
        };

        validatedAndProcessedAudio.forEach(audioItem => {
          if (audioItem.category === CATEGORY_CCNA) {
            groups[CATEGORY_CCNA].push(audioItem);
          } else if (audioItem.category === JSON_CATEGORY_DATABASE) {
            groups[CATEGORY_DATABASE_AUDIO].push(audioItem); // Group into the new display category
          } else { 
            // All others, including CATEGORY_APPLIED_NETWORKING and any unknown, go to Applied Networking
            groups[CATEGORY_APPLIED_NETWORKING].push(audioItem);
          }
        });
        
        console.log(`AudioLessonsPage: Processed and grouped audio files. Applied: ${groups[CATEGORY_APPLIED_NETWORKING].length}, CCNA: ${groups[CATEGORY_CCNA].length}, Databases: ${groups[CATEGORY_DATABASE_AUDIO].length}`);
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
            {error} Please try again later or check the console for more details. Ensure <code>public/data/audio.json</code> is correctly formatted and accessible, and all listed audio files exist in <code>public/data/audio/</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const categoriesToDisplay = [CATEGORY_APPLIED_NETWORKING, CATEGORY_CCNA, CATEGORY_DATABASE_AUDIO];

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-2">
          <Podcast className="h-8 w-8 text-primary" />
          Audio Lessons
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Listen to educational audio clips on networking, electronics, and database topics, grouped by category.
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
            const IconComponent = category === CATEGORY_CCNA ? BookOpen :
                                  category === CATEGORY_DATABASE_AUDIO ? Database : Network; // Assign Database icon

            if (filesInCategory.length === 0) { // Only skip if no files AND it's not a primary category we always want to show
                return null;
            }

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

