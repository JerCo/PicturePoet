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
  prompt: `You are a poet. Based on the following keywords, generate a poem. Consider the user's requested style, if provided.

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
    const {output} = await prompt(input);
    return output!;
  }
);
