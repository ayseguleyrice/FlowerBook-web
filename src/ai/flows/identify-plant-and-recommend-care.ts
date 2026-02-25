'use server';
/**
 * @fileOverview A plant identification and care recommendation AI agent.
 *
 * - identifyPlantAndRecommendCare - A function that handles the plant identification and care recommendation process.
 * - IdentifyPlantAndRecommendCareInput - The input type for the identifyPlantAndRecommendCare function.
 * - IdentifyPlantAndRecommendCareOutput - The return type for the identifyPlantAndRecommendCare function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlantAndRecommendCareInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A description of the plant from the user.'),
});
export type IdentifyPlantAndRecommendCareInput = z.infer<
  typeof IdentifyPlantAndRecommendCareInputSchema
>;

const IdentifyPlantAndRecommendCareOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the input is identified as a plant.'),
    commonName: z.string().describe('The common name of the identified plant.'),
    latinName: z.string().describe('The Latin name (scientific name) of the identified plant.'),
  }),
  careRecommendations: z.object({
    watering: z.string().describe('Detailed recommendations for watering the plant.'),
    pruning: z.string().describe('Detailed recommendations for pruning the plant.'),
    light: z.string().describe('Detailed recommendations for the plant\u2019s light exposure.'),
    humidity: z.string().describe('Detailed recommendations for the plant\u2019s humidity needs.'),
    toxicity: z.string().describe('Information regarding the plant\u2019s toxicity to humans or pets.'),
  }),
});
export type IdentifyPlantAndRecommendCareOutput = z.infer<
  typeof IdentifyPlantAndRecommendCareOutputSchema
>;

export async function identifyPlantAndRecommendCare(
  input: IdentifyPlantAndRecommendCareInput
): Promise<IdentifyPlantAndRecommendCareOutput> {
  return identifyPlantAndRecommendCareFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlantAndRecommendCarePrompt',
  input: {schema: IdentifyPlantAndRecommendCareInputSchema},
  output: {schema: IdentifyPlantAndRecommendCareOutputSchema},
  prompt: `You are an expert botanist and plant care specialist. Your task is to identify a plant from an image and a user-provided description, and then provide comprehensive care recommendations based on the identified species.

First, determine if the provided input is indeed a plant. If it is, identify its common and Latin name.

Second, provide specific care recommendations for the identified plant covering the following aspects: watering, pruning, light, humidity, and toxicity. Each recommendation should be detailed and practical.

Use the following information for identification and recommendations:

Description: {{{description}}}
Photo: {{media url=photoDataUri}}`,
});

const identifyPlantAndRecommendCareFlow = ai.defineFlow(
  {
    name: 'identifyPlantAndRecommendCareFlow',
    inputSchema: IdentifyPlantAndRecommendCareInputSchema,
    outputSchema: IdentifyPlantAndRecommendCareOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the plant identification prompt.');
    }
    return output;
  }
);
