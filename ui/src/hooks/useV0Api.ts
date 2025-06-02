import { useState } from 'react';
import { generateUIComponent, generateStructuredData, checkV0Availability } from '../services/v0Api';

interface UseV0ApiOptions {
  apiKey?: string;
}

export function useV0Api(options: UseV0ApiOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const apiKey = options.apiKey || process.env.VERCEL_API_KEY || '';

  const generateComponent = async (prompt: string) => {
    if (!apiKey) {
      setError('Vercel API key is required. Set VERCEL_API_KEY environment variable.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateUIComponent(prompt, apiKey);
      
      if (result.success) {
        return result.component;
      } else {
        setError(result.error || 'Failed to generate component');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateData = async (prompt: string, schema: any) => {
    if (!apiKey) {
      setError('Vercel API key is required. Set VERCEL_API_KEY environment variable.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generateStructuredData(prompt, schema, apiKey);
      
      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Failed to generate data');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!apiKey) {
      setIsAvailable(false);
      setError('Vercel API key is required');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const available = await checkV0Availability(apiKey);
      setIsAvailable(available);
      return available;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsAvailable(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateComponent,
    generateData,
    checkAvailability,
    isLoading,
    error,
    isAvailable,
    hasApiKey: !!apiKey,
  };
}
