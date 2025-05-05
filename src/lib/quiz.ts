import type { Question, RawQuestion } from '@/types/quiz';
// Removed: import { promises as fs } from 'fs';
// Removed: import path from 'path';

// Client-side functions moved to quiz-client.ts
// shuffleArray and normalizeQuestion are now imported from there in components that need them.

/**
 * Loads and parses raw quiz data from a file. Does NOT normalize or shuffle.
 * This function is NOT intended for direct use in Client Components.
 * It should be used in Server Components, API routes, or build scripts.
 * Client components should use `fetch` to get data from `/public/data`.
 *
 * @param filename The name of the JSON file in the /public/data directory.
 * @returns A promise that resolves to an array of RawQuestion objects or throws an error.
 */
export async function loadRawQuizData_SERVER_ONLY(filename: string): Promise<RawQuestion[]> {
    // Dynamically import server-only modules
    const fs = await import('fs/promises');
    const path = await import('path');

    const filePath = path.join(process.cwd(), 'public', 'data', filename);

    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const rawData: RawQuestion[] = JSON.parse(fileContent);

        if (!Array.isArray(rawData)) {
        throw new Error(`Invalid quiz data format in ${filename}: Expected an array.`);
        }

        // Basic validation can still happen here if needed, but normalization is client-side
        // e.g., check if rawData has items

        return rawData;

    } catch (error) {
        console.error(`Error loading or parsing quiz file ${filename}:`, error);
        if (error instanceof SyntaxError) {
            throw new Error(`Failed to parse JSON from ${filename}. Please check the file format.`);
        } else if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`Quiz file ${filename} not found at ${filePath}.`);
        }
        // Re-throw a more specific error or a generic one
        throw new Error(`An error occurred while loading the raw quiz data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// The original loadQuiz function is removed as its logic (including fs usage)
// is problematic when imported directly into client components.
// Fetching data client-side is the preferred approach for this setup.
// If server-side loading is strictly required for other reasons,
// it should be done within Server Components or API routes, not imported into client components.
