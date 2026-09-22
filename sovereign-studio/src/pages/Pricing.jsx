import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MetaSEO from '../components/layout/MetaSEO';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Free forever',
      hasToggle: false,
      features: [
        'Client-Side execution engine',
        'Tesseract & WebGPU OCR',
        'Basic ROI canvas selection',
        'Single document export (.txt, .json)',
        'Zero data logging guaranteed',
        'Community support',
      ],
      ctaText: 'Get started',
      ctaLink: '/workbench',
      highlight: false,
    },
    {
      name: 'Basic',
      price: isYearly ? '$10' : '$12',
      period: 'per user / month',
      hasToggle: true,
      features: [
        'All Free features +',
        'ChromaDB local vector store',
        'Batch ROI crop processing',
        'Standard PDF & Excel export',
        'Local ONNX acceleration',
        'Basic model quantization',
      ],
      ctaText: 'Start Free Trial',
      ctaLink: '/workbench',
      highlight: false,
    },
    {
      name: 'Business',
      price: isYearly ? '$16' : '$20',
      period: 'per user / month',
      hasToggle: true,
      features: [
        'All Basic features +',
        'Docker-isolated execution sandbox',
        'Private local RAG pipelines',
        'WASM Python execution runtime',
        'Custom vision model weights',
        'Priority email & ticket support',
      ],
      ctaText: 'Upgrade to Business',
      ctaLink: '/contact',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Annual billing only',
      hasToggle: false,
      features: [
        'All Business features +',
        'On-Premises hardware deployment',
        'SAML, SCIM & Air-Gap license keys',
        'SOC2 & HIPAA compliance package',
        'Granular admin controls',
        'Dedicated solutions architect',
        '24/7 SLA & incident response',
      ],
      ctaText: 'Contact Sales',
      ctaLink: '/contact',
      highlight: false,
    },
  ];

  return (
    <>
      <MetaSEO
        title="Pricing - Sovereign AI"
        description="Simple, transparent plans for local air-gapped document processing."
      />

      <div className="min-h-screen bg-[#0B0C0E] text-[#F7F8F8] pt-20 pb-28 px-6 font-sans">
        <div className="max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-[#F7F8F8]">
              Pricing
            </h1>
            <p className="text-[#8A8F98] text-base mt-4 font-normal">
              Zero telemetry. Zero hidden API charges. Complete data sovereignty.
            </p>

            {/* Global Billing Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-[#121417] p-1.5 rounded-full border border-[#22262F]">
              <button
                type="button"
                onClick={() => setIsYearly(false)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !isYearly ? 'bg-[#22262F] text-[#F7F8F8]' : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setIsYearly(true)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isYearly ? 'bg-[#35E6A4] text-[#0B0C0E]' : 'text-[#8A8F98] hover:text-[#F7F8F8]'
                }`}
              >
                <span>Annual billing</span>
                <span className="text-[10px] bg-[#0B0C0E]/20 px-1.5 py-0.5 rounded font-mono">20% off</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col justify-between rounded-xl p-6 bg-[#121417]/60 border transition-all ${
                  plan.highlight
                    ? 'border-[#35E6A4]/50 shadow-lg shadow-[#35E6A4]/5'
                    : 'border-[#22262F] hover:border-[#2F3440]'
                }`}
              >
                <div>
                  {/* Title & Price */}
                  <h3 className="text-2xl font-semibold text-[#F7F8F8] tracking-tight">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight text-[#F7F8F8] font-mono">
                      {plan.price}
                    </span>
                    {plan.price !== '$0' && plan.price !== 'Custom' && (
                      <span className="text-xs text-[#8A8F98] font-medium">{plan.period}</span>
                    )}
                  </div>
                  
                  {/* Subtext */}
                  <div className="mt-2 min-h-[20px] text-xs text-[#6E737D]">
                    {plan.price === '$0' || plan.price === 'Custom' ? (
                      <span>{plan.period}</span>
                    ) : (
                      <span>{isYearly ? 'Billed annually' : 'Billed monthly'}</span>
                    )}
                  </div>

                  <div className="my-6 border-t border-[#22262F]" />

                  {/* Feature List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5 text-xs text-[#8A8F98]">
                        <div className="w-4 h-4 rounded-full bg-[#181B20] border border-[#22262F] flex items-center justify-center shrink-0">
                          <svg className="w-2.5 h-2.5 text-[#F7F8F8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-[#D0D6E0]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Link
                  to={plan.ctaLink}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-medium text-center transition-all ${
                    plan.highlight
                      ? 'bg-[#F7F8F8] text-[#0B0C0E] hover:bg-[#E1E4E6]'
                      : 'bg-[#181B20] text-[#F7F8F8] hover:bg-[#22262F] border border-[#22262F]'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            ))}
          </div>

          {/* Air-Gap Guarantee Banner */}
          <div className="mt-20 border-t border-[#22262F] pt-12 flex flex-col md:flex-row items-center justify-between text-[#8A8F98] text-xs gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#35E6A4]"></span>
              <span>100% Air-Gapped Verification Guaranteed across all tiers.</span>
            </div>
            <Link to="/about" className="hover:text-[#F7F8F8] text-[#8A8F98] underline underline-offset-4 transition-colors">
              Read Security Architecture Whitepaper &rarr;
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}