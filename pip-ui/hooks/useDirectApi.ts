// Direct API hook that doesn't rely on useEffect
import { useState, useRef, useEffect } from 'react';
import { ChatSession } from '@/lib/types';

export function useDirectChatSessions() {
  console.log("🚀 useDirectChatSessions called");
  
  const [data, setData] = useState<ChatSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Direct fetch function without useEffect
  const fetchData = async () => {
    // Prevent fetching during SSR
    if (typeof window === 'undefined') {
      console.log("🚀 Skipping fetch during SSR");
      return null;
    }
    
    console.log("🚀 Direct fetch starting...");
    setLoading(true);
    setError(null);
    
    try {
      // Use Next.js proxy instead of direct backend call - FIXED: removed double /api prefix
      const url = '/api/proxy/chat/sessions';
      console.log("🚀 Direct fetch attempting proxied URL:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Code': 'hermes',
        },
      });
      
      console.log("🚀 Direct fetch proxied response:", response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚀 Direct fetch error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("🚀 Direct fetch success - sessions:", result.length);
      
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error("🚀 Direct fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  // Auto-fetch once when component mounts
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData();
    }
  }, []);

  return { data, loading, error, refetch: fetchData };
}

export function useDirectSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    sessionId: string, 
    content: string, 
    attachments: File[] = []
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log("🚀 Direct sendMessage called with:", { sessionId, content, attachmentsCount: attachments.length });
    
    setLoading(true);
    setError(null);

    try {
      // Use the Next.js proxy instead of direct backend call - FIXED: removed double /api prefix
      const response = await fetch(`/api/proxy/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Code': 'hermes',
        },
        body: JSON.stringify({ content }),
      });

      console.log("🚀 Direct sendMessage proxied response:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚀 Direct sendMessage error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log("🚀 Direct sendMessage success:", result);

      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      console.error("🚀 Direct sendMessage error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  return { sendMessage, loading, error };
}

export function useDirectChatMessages(sessionId?: string) {
  console.log("🚀 useDirectChatMessages called with sessionId:", sessionId);
  
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async (id: string) => {
    if (!id) return null;
    
    console.log("🚀 Direct fetchMessages for sessionId:", id);
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: removed double /api prefix
      const response = await fetch(`/api/proxy/chat/sessions/${id}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Code': 'hermes',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🚀 Direct fetchMessages error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log("🚀 Direct fetchMessages success - messages:", result.length);
      
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      console.error("🚀 Direct fetchMessages error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchMessages(sessionId);
    }
  }, [sessionId]);

  return { data, loading, error, refetch: () => sessionId ? fetchMessages(sessionId) : null };
}
