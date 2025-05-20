
// src/app/audio/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AudioCard from '@/components/audio/AudioCard';
import type { AudioMetadata } from '@/types/audio';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Podcast, Network, BookOpen, Database } from 'lucide-react';

interface GroupedAudio {
  [category: string]: AudioMetadata[];
}

// Define constants for category names to avoid typos
const CATEGORY_APPLIED_NETWORKING = "Applied Networking";
const CATEGORY_CCNA = "CCNA Audio"; // Display name for CCNA section
const CATEGORY_DATABASE_AUDIO = "Databases and Data Analysis"; // Display name for the new section

// Keys as they might appear in audio.json
const JSON_KEY_CATEGORY_CCNA = "CCNA Audio";
const JSON_KEY_CATEGORY_DATABASE = "Database Audio";
const JSON_KEY_CATEGORY_APPLIED = "Applied Networking";


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
            (item.category && typeof item.category !== 'string') || // Category is optional but must be string if present
            (item.mimeType && typeof item.mimeType !== 'string')  // MimeType is optional but must be string if present
          ) {
            console.warn(`AudioLessonsPage: Skipping invalid audio entry at index ${index}. Title: "${itemTitle}", Filename: "${itemFilename || 'MISSING'}". Reason: Missing/invalid essential fields. Item:`, item);
            return null;
          }

          // Ensure filename passed to AudioCard is just the bare filename
          const bareFilename = item.filename.split('/').pop();
          
          console.log(`AudioLessonsPage: Processing item #${index} - Original JSON filename: "${item.filename}", Computed bareFilename for AudioCard: "${bareFilename}"`);
          
          return {
            id: item.id,
            title: item.title,
            description: item.description || '', 
            filename: bareFilename, // Pass only the bare filename
            category: item.category, // Pass the category as is from JSON
            mimeType: item.mimeType,
          };
        }).filter((item): item is AudioMetadata => item !== null);


        const groups: GroupedAudio = {
          [CATEGORY_APPLIED_NETWORKING]: [],
          [CATEGORY_CCNA]: [],
          [CATEGORY_DATABASE_AUDIO]: [],
        };

        validatedAndProcessedAudio.forEach(audioItem => {
          // Prioritize explicit category matches
          if (audioItem.category === JSON_KEY_CATEGORY_CCNA) {
            groups[CATEGORY_CCNA].push(audioItem);
          } else if (audioItem.category === JSON_KEY_CATEGORY_DATABASE) {
            groups[CATEGORY_DATABASE_AUDIO].push(audioItem);
          } else if (audioItem.category === JSON_KEY_CATEGORY_APPLIED) {
            groups[CATEGORY_APPLIED_NETWORKING].push(audioItem);
          }
          // Fallback logic based on filename if category is missing or not one of the explicit ones
          else if (!audioItem.category && audioItem.filename.toLowerCase().startsWith('ccna')) {
             groups[CATEGORY_CCNA].push(audioItem);
          } else if (!audioItem.category && audioItem.filename.toLowerCase().includes('database')) {
             groups[CATEGORY_DATABASE_AUDIO].push(audioItem);
          }
          // Default to Applied Networking for anything else (including if category is undefined or an unknown string)
          else { 
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
  
  // Define the order of categories for display
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
          {categoriesToDisplay.map((categoryName) => {
            const filesInCategory = groupedAudioFiles[categoryName] || [];
            
            // Skip rendering the section if there are no files for it.
            if (filesInCategory.length === 0) {
                return null;
            }

            const IconComponent = categoryName === CATEGORY_CCNA ? BookOpen :
                                  categoryName === CATEGORY_DATABASE_AUDIO ? Database : Network;

            return (
              <section key={categoryName}>
                <h2 className="text-2xl font-semibold mb-6 border-b pb-2 flex items-center gap-2">
                  <IconComponent className="h-6 w-6 text-accent" />
                  {categoryName} ({filesInCategory.length} {filesInCategory.length === 1 ? 'lesson' : 'lessons'})
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
