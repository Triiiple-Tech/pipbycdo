import React, { useState } from 'react';
import { useV0Api } from '../hooks/useV0Api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { LoadingSpinner } from './LoadingSpinner';

export function V0ApiDemo() {
  const [prompt, setPrompt] = useState('');
  const [generatedComponent, setGeneratedComponent] = useState<string | null>(null);
  const { generateComponent, checkAvailability, isLoading, error, isAvailable, hasApiKey } = useV0Api();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    const component = await generateComponent(prompt);
    setGeneratedComponent(component);
  };

  const handleCheckAvailability = async () => {
    await checkAvailability();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>v0 API Integration Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasApiKey && (
            <Alert>
              <AlertDescription>
                To use the v0 API, you need to set your Vercel API key in the VERCEL_API_KEY environment variable.
                You can get your API key from your Vercel dashboard.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleCheckAvailability} 
              disabled={isLoading || !hasApiKey}
              variant="outline"
            >
              Check API Availability
            </Button>
            {isAvailable !== null && (
              <div className={`px-3 py-2 rounded-md text-sm ${
                isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isAvailable ? 'API Available ✓' : 'API Unavailable ✗'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Describe what you want to build:
            </label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A modern login form with email and password fields"
              disabled={isLoading || !hasApiKey}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading || !prompt.trim() || !hasApiKey}
            className="w-full"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              'Generate Component'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {generatedComponent && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Component</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                  <code>{generatedComponent}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
