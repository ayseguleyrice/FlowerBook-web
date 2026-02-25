import { NextResponse } from 'next/server';
import { identifyPlantAndRecommendCare } from '@/ai/flows/identify-plant-and-recommend-care';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { photoDataUri?: string; description?: string };

    if (!body.photoDataUri) {
      return NextResponse.json({ error: 'photoDataUri is required.' }, { status: 400 });
    }

    const result = await identifyPlantAndRecommendCare({
      photoDataUri: body.photoDataUri,
      description: body.description || 'No description provided',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
