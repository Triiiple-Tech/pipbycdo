// Next.js API Route Proxy for Backend Communication
// This proxy bypasses CORS issues by routing requests through Next.js server

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(req, resolvedParams, 'GET')
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(req, resolvedParams, 'POST')
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(req, resolvedParams, 'PUT')
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(req, resolvedParams, 'DELETE')
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest(req, resolvedParams, 'PATCH')
}

async function handleRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const pathSegments = params.path || []
    const backendPath = pathSegments.join('/')
    // Add /api prefix for backend routes
    const backendUrl = `${BACKEND_BASE_URL}/api/${backendPath}`
    
    // Get search params from the original request
    const searchParams = req.nextUrl.searchParams.toString()
    const fullUrl = searchParams ? `${backendUrl}?${searchParams}` : backendUrl
    
    console.log(`[Proxy] ${method} ${fullUrl}`)
    
    // Prepare headers for the backend request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Forward specific headers if they exist
    const forwardHeaders = ['Authorization', 'X-Internal-Code', 'Accept']
    forwardHeaders.forEach(header => {
      const value = req.headers.get(header)
      if (value) {
        headers[header] = value
      }
    })
    
    // Prepare request body for non-GET requests
    let body: string | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const requestBody = await req.text()
        body = requestBody || undefined
      } catch (error) {
        console.warn('[Proxy] Could not read request body:', error)
      }
    }
    
    // Make the request to the backend
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    })
    
    console.log(`[Proxy] Backend response: ${response.status} ${response.statusText}`)
    
    // Get response data
    const responseText = await response.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }
    
    // Return the response with proper status
    return NextResponse.json(responseData, {
      status: response.status,
      statusText: response.statusText,
    })
    
  } catch (error) {
    console.error('[Proxy] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          path: params.path?.join('/'),
          method,
        }
      },
      { status: 500 }
    )
  }
}
