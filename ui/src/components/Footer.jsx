import React from 'react';
import { ExternalLink } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cdo-red to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CDO</span>
              </div>
              <span className="text-lg font-bold text-black">
                Construction Intelligence
              </span>
            </div>
            <p className="text-gray-700 mb-4 max-w-md">
              Empowering construction professionals with AI-driven document
              analysis and project intelligence.
            </p>
            <p className="text-sm text-gray-600">
              © 2025 CDO Construction Intelligence. All rights reserved.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-black uppercase tracking-widest mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Document Analysis
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Project Analytics
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Smart Insights
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  API Access
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-black uppercase tracking-widest mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-700 hover:text-cdo-red transition-colors text-sm"
                >
                  Status Page
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
