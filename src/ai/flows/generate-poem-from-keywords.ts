// This is an AI-powered code! Do not edit, except under strict guidance from the Gemini AI assistant.
'use server';
/**
 * @fileOverview Poem generator based on keywords.
 *
 * - generatePoemFromKeywords - A function that handles poem generation.
 * - GeneratePoemFromKeywordsInput - The input type for the generatePoemFromKeywords function.
 * - GeneratePoemFromKeywordsOutput - The return type for the generatePoemFromKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromKeywordsInputSchema = z.object({
  keywords: z
    .string()
    .describe('The keywords identified from the photo.'),
  style: z.string().optional().describe('The desired style of the poem (e.g., length, tone).'),
});
export type GeneratePoemFromKeywordsInput = z.infer<typeof GeneratePoemFromKeywordsInputSchema>;

const GeneratePoemFromKeywordsOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromKeywordsOutput = z.infer<typeof GeneratePoemFromKeywordsOutputSchema>;

export async function generatePoemFromKeywords(input: GeneratePoemFromKeywordsInput): Promise<GeneratePoemFromKeywordsOutput> {
  return generatePoemFromKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePoemFromKeywordsPrompt',
  input: {schema: GeneratePoemFromKeywordsInputSchema},
  output: {schema: GeneratePoemFromKeywordsOutputSchema},
  prompt: `You are a poet. Based on the following keywords, generate a poem.
  
When formatting the poem, ensure the line lengths are balanced for centered display. Avoid very short or very long lines next to each other.

Consider the user's requested style, if provided.

Keywords: {{{keywords}}}
Style: {{{style}}}

Poem:`,
});

const generatePoemFromKeywordsFlow = ai.defineFlow(
  {
    name: 'generatePoemFromKeywordsFlow',
    inputSchema: GeneratePoemFromKeywordsInputSchema,
    outputSchema: GeneratePoemFromKeywordsOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    let baseDelay = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (e: any) {
        // Check if the error is a 503 and if we have retries left
        if (e.message && e.message.includes('[503') && i < maxRetries - 1) {
          console.log(`Attempt ${i + 1} failed with 503 error. Retrying in ${baseDelay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay));
          baseDelay *= 2; // Exponential backoff
        } else {
          // If it's not a 503 or we've run out of retries, rethrow the error
          throw e;
        }
      }
    }
    // This part should be unreachable if the loop completes, but typescript needs it.
    throw new Error('Poem generation failed after multiple retries.');
  }
);

    