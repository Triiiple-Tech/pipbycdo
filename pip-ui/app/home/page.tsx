"use client"

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            PIP AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Advanced Construction Document Analysis Platform
          </p>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                AI-Powered Construction Intelligence
              </h2>
              <p className="text-gray-600 mb-6">
                Streamline your construction document processing with our suite of 8 specialized AI agents. 
                From text extraction to cost estimation, we handle it all.
              </p>
              <Link 
                href="/demo"
                className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View Live Demo
              </Link>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Platform Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Document Text Extraction
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Automated Cost Estimation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Quality Assurance Validation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Smartsheet Integration
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Real-time Analytics
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Frontend</h3>
            <p className="text-gray-600 text-sm">React/TypeScript with Tailwind CSS</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Backend</h3>
            <p className="text-gray-600 text-sm">FastAPI with AI Agent Architecture</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Database</h3>
            <p className="text-gray-600 text-sm">Supabase (PostgreSQL)</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800 text-white rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-6 text-center">Platform Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">8</div>
              <div className="text-sm text-gray-300">AI Agents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">100%</div>
              <div className="text-sm text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">Real-time</div>
              <div className="text-sm text-gray-300">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">24/7</div>
              <div className="text-sm text-gray-300">Available</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Ready to see the platform in action?
          </p>
          <Link 
            href="/demo"
            className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-lg"
          >
            Launch Demo →
          </Link>
        </div>
      </div>
    </div>
  )
}
