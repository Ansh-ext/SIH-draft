import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetaSEO from '../components/layout/MetaSEO';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', organization: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Action handled locally
    navigate('/thank-you');
  };

  return (
    <>
      <MetaSEO 
        title="Contact Enterprise Support" 
        description="Get in touch with Sovereign Studio engineering team for physical air-gapped deployment, custom model integration, and on-premise hardware setups."
      />

      <div className="flex-1 bg-slate-950 text-slate-100 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Left Column: Real Address & System Setup Info */}
          <div>
            <span className="text-xs font-mono text-amber-500 uppercase tracking-widest block mb-2">
              Get In Touch
            </span>
            <h1 className="text-3xl font-extrabold text-white mb-6">
              Enterprise Deployment &amp; Support
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              Need assistance setting up Sovereign Studio on isolated LAN servers or dedicated local hardware? Contact our engineering node directly.
            </p>

            <div className="space-y-6 text-xs text-slate-300">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <h4 className="text-amber-400 font-bold mb-1 font-mono">Physical Address</h4>
                <p className="text-slate-400">Sovereign Hardware &amp; Security Lab</p>
                <p className="text-slate-400">IIIT Bhopal Campus, MACT Campus Road</p>
                <p className="text-slate-400">Bhopal, Madhya Pradesh - 462003, India</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <h4 className="text-amber-400 font-bold mb-1 font-mono">Encrypted Direct Contact</h4>
                <p className="text-slate-400">Email: <span className="text-slate-200 font-mono">support@sovereign.studio</span></p>
                <p className="text-slate-400">GPG Fingerprint: <span className="text-slate-400 font-mono text-[10px]">4F89 B211 9A32 D781 E200</span></p>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="text-white font-bold text-base mb-4">Request Deployment Consultation</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Inspector Sharma"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Official Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  placeholder="name@organization.gov.in"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Organization / Department</label>
                <input 
                  type="text" 
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  placeholder="Department of Technology"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Deployment Query / Requirements</label>
                <textarea 
                  rows="4" 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Describe hardware environment and document processing scale..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors text-xs"
              >
                Submit Inquiry
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}