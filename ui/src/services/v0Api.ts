import { vercel } from '@ai-sdk/vercel';
import { generateObject, generateText } from 'ai';

// Initialize the v0 provider
const v0 = vercel('v0-1.0-md');

/**
 * Generate UI components using v0 API
 * @param prompt - Description of what you want to build
 * @param apiKey - Your Vercel API key
 * @returns Generated component code
 */
export async function generateUIComponent(prompt: string, apiKey: string) {
  try {
    const result = await generateText({
      model: v0,
      prompt: `Generate a React component: ${prompt}`,
      apiKey,
    });

    return {
      success: true,
      component: result.text,
    };
  } catch (error) {
    console.error('Error generating UI component:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate structured data using v0 API
 * @param prompt - Description of the data structure you want
 * @param schema - Zod schema for the expected output
 * @param apiKey - Your Vercel API key
 * @returns Generated structured data
 */
export async function generateStructuredData(
  prompt: string, 
  schema: any, 
  apiKey: string
) {
  try {
    const result = await generateObject({
      model: v0,
      prompt,
      schema,
      apiKey,
    });

    return {
      success: true,
      data: result.object,
    };
  } catch (error) {
    console.error('Error generating structured data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if v0 API is available and configured
 * @param apiKey - Your Vercel API key
 * @returns Boolean indicating if the API is ready
 */
export async function checkV0Availability(apiKey: string): Promise<boolean> {
  try {
    const result = await generateText({
      model: v0,
      prompt: 'Hello, world!',
      apiKey,
      maxTokens: 10,
    });
    
    return result.text.length > 0;
  } catch (error) {
    console.error('v0 API not available:', error);
    return false;
  }
}
