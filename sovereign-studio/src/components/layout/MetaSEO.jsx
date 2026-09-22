import React, { useEffect } from 'react';

export default function MetaSEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | Sovereign Studio` : 'Sovereign Studio | Air-Gapped AI Workbench';
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || '100% Offline, Air-Gapped Local AI Workbench for Enterprise Documents.');
    }
  }, [title, description]);

  return null;
}