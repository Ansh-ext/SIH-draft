import React from 'react';
import MetaSEO from '../components/layout/MetaSEO';

export default function PrivacyPolicy() {
  return (
    <>
      <MetaSEO 
        title="Privacy & Data Sovereignty Policy" 
        description="Read our 100% Air-Gapped Data Sovereignty Policy. Sovereign Studio guarantees zero outbound telemetry and local document persistence."
      />

      <div className="flex-1 bg-slate-950 text-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 text-xs text-slate-300">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-amber-500 font-mono text-[10px] tracking-widest uppercase block mb-1">Compliance Standard</span>
            <h1 className="text-2xl font-bold text-white">Data Sovereignty &amp; Air-Gap Policy</h1>
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-100 font-mono">1. Zero External Telemetry</h2>
            <p className="text-slate-400 leading-relaxed">
              Sovereign Studio is strictly engineered for air-gapped environments. No analytics, tracking tokens, API calls, or document content are ever transmitted to cloud servers or third-party LLM providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-100 font-mono">2. Local Workspace Isolation</h2>
            <p className="text-slate-400 leading-relaxed">
              All processed PDF/image documents, generated vector embeddings (ChromaDB), and temporary Docker execution artifacts remain entirely within your local filesystem directory.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-100 font-mono">3. Session Persistence &amp; Cryptographic Storage</h2>
            <p className="text-slate-400 leading-relaxed">
              Session state and verification logs are cryptographically hashed using SHA-256 and stored in local SQLite databases without external key synchronization.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}