'use server';
/**
 * @fileOverview A Genkit flow for moderating uploaded images, checking for plants and offensive content.
 *
 * - moderateUploadedImage - A function that handles the image moderation process.
 * - ModerateUploadedImageInput - The input type for the moderateUploadedImage function.
 * - ModerateUploadedImageOutput - The return type for the moderateUploadedImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ModerateUploadedImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an uploaded image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z
    .string()
    .optional()
    .describe('An optional user-provided description of the image.'),
});
export type ModerateUploadedImageInput = z.infer<
  typeof ModerateUploadedImageInputSchema
>;

// Output Schema
const ModerateUploadedImageOutputSchema = z.object({
  isPlant: z
    .boolean()
    .describe('Whether the primary subject of the image is identified as a plant.'),
  isOffensive: z
    .boolean()
    .describe('Whether the image or description contains offensive, inappropriate, or non-plant content.'),
  moderationReason: z
    .string()
    .describe(
      'A brief explanation of the moderation decision, especially if the image is not suitable for the feed.'
    ),
  isSuitableForFeed: z
    .boolean()
    .describe(
      'Overall decision: true if the image is a plant and not offensive, false otherwise.'
    ),
});
export type ModerateUploadedImageOutput = z.infer<
  typeof ModerateUploadedImageOutputSchema
>;

// Wrapper function for the flow
export async function moderateUploadedImage(
  input: ModerateUploadedImageInput
): Promise<ModerateUploadedImageOutput> {
  return moderateUploadedImageFlow(input);
}

// Define the Genkit Prompt
const moderationPrompt = ai.definePrompt({
  name: 'imageModerationPrompt',
  input: {schema: ModerateUploadedImageInputSchema},
  output: {schema: ModerateUploadedImageOutputSchema},
  prompt: `You are an AI assistant designed to moderate user-uploaded images for a plant-themed social network.
Your task is to analyze the provided image and description to determine if it meets the following criteria:
1. The primary subject of the image must be a plant or related to plants (e.g., gardening, plant care).
2. The image and any associated description must not contain any offensive, inappropriate, or harmful content.

Based on your analysis, provide a JSON response with the following fields:
- 'isPlant': a boolean indicating whether the primary subject is a plant.
- 'isOffensive': a boolean indicating whether the content is offensive or inappropriate.
- 'moderationReason': a string explaining your decision, especially if 'isSuitableForFeed' is false.
- 'isSuitableForFeed': a boolean, true if 'isPlant' is true AND 'isOffensive' is false, otherwise false.

Image: {{media url=photoDataUri}}
Description: {{{description}}}`,
  config: {
    // Configure safety settings to ensure strict moderation
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

// Define the Genkit Flow
const moderateUploadedImageFlow = ai.defineFlow(
  {
    name: 'moderateUploadedImageFlow',
    inputSchema: ModerateUploadedImageInputSchema,
    outputSchema: ModerateUploadedImageOutputSchema,
  },
  async (input) => {
    const {output} = await moderationPrompt(input);
    if (!output) {
      throw new Error('Failed to get moderation output from the AI model.');
    }
    return output;
  }
);
