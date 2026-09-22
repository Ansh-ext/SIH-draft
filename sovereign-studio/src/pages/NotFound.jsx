import React from 'react';
import { Link } from 'react-router-dom';
import MetaSEO from '../components/layout/MetaSEO';

export default function NotFound() {
  return (
    <>
      <MetaSEO title="404 - Page Not Found | Sovereign AI" description="The requested route does not exist." />
      
      <div className="flex-1 bg-[#0B0C0E] flex items-center justify-center py-24 px-6">
        <div className="max-w-md w-full bg-[#121417]/80 border border-[#22262F] rounded-2xl p-8 text-center shadow-2xl backdrop-blur-sm">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35E6A4]/10 border border-[#35E6A4]/20 text-[#35E6A4] font-mono text-xs uppercase tracking-wider mb-6">
            <span>Error 404</span>
          </div>

          <h1 className="text-3xl font-semibold text-[#F7F8F8] tracking-tight mb-3">
            Route Not Found
          </h1>

          <p className="text-[#8A8F98] text-xs leading-relaxed mb-8">
            The requested document inspection route or memory vector offset does not exist in local storage.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-[#F7F8F8] text-[#0B0C0E] font-medium text-xs hover:bg-[#E1E4E6] transition-colors"
          >
            Return to Home Page
          </Link>
        </div>
      </div>
    </>
  );
}