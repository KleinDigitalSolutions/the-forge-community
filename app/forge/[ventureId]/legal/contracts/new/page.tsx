/**
 * Contract Generator Page
 * Form to create new legal documents with AI
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudioShell } from '@/app/components/forge/StudioShell';
import { AIGenerator } from '@/app/components/forge/AIGenerator';
import { DocumentExport } from '@/app/components/forge/DocumentExport';
import { Scale, ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { LEGAL_DOCUMENT_TEMPLATES, type LegalDocumentType } from '@/types/legal';

export default function ContractGeneratorPage({
  params,
}: {
  params: { ventureId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [selectedTemplate, setSelectedTemplate] = useState<LegalDocumentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    documentTitle: '',
    partnerCompanyName: '',
    partnerContactName: '',
    partnerContactEmail: '',
    partnerContactPhone: '',
    partnerAddress: '',
    duration: '',
    paymentTerms: '',
    scope: '',
    governingLaw: 'Germany',
    additionalInstructions: '',
  });

  // Load template on mount
  useEffect(() => {
    if (templateId) {
      const template = LEGAL_DOCUMENT_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplate(template.type);
        setFormData((prev) => ({
          ...prev,
          documentTitle: `${template.name} - [Partner Name]`,
          duration: template.defaultTerms.duration || '',
          paymentTerms: template.defaultTerms.paymentTerms || '',
          governingLaw: template.defaultTerms.governingLaw || 'Germany',
        }));
      }
    }
  }, [templateId]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/ventures/${params.ventureId}/legal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventureId: params.ventureId,
          documentType: selectedTemplate,
          documentTitle: formData.documentTitle,
          partnerInfo: {
            companyName: formData.partnerCompanyName,
            contactName: formData.partnerContactName,
            contactEmail: formData.partnerContactEmail,
            contactPhone: formData.partnerContactPhone,
            address: formData.partnerAddress,
          },
          contractTerms: {
            duration: formData.duration,
            paymentTerms: formData.paymentTerms,
            scope: formData.scope,
            governingLaw: formData.governingLaw,
          },
          additionalInstructions: formData.additionalInstructions,
        }),
      });

      const data = await response.json();

      if (data.success && data.document) {
        setGeneratedContent(data.document.generatedContent);
        setSavedDocId(data.document.id);
      } else {
        alert('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate contract');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndView = () => {
    if (savedDocId) {
      router.push(`/forge/${params.ventureId}/legal/contracts/${savedDocId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Legal Studio
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Scale className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-4xl font-instrument-serif text-white mb-2">
            Generate Contract
          </h1>
          <p className="text-white/40 text-sm">
            Fill in the details and let AI create your legal document
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="glass-card p-6 rounded-xl border border-white/10 space-y-6">
          <h2 className="text-xl font-instrument-serif text-white">
            Contract Details
          </h2>

          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              value={formData.documentTitle}
              onChange={(e) =>
                setFormData({ ...formData, documentTitle: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
              placeholder="e.g., NDA with Supplier XYZ"
            />
          </div>

          {/* Partner Info */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-widest">
              Partner Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.partnerCompanyName}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerCompanyName: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.partnerContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerContactName: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.partnerContactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerContactEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.partnerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerAddress: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-sm font-bold text-white/80 mb-4 uppercase tracking-widest">
              Contract Terms
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="e.g., 12 months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentTerms: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="e.g., Net 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Scope / Services
                </label>
                <textarea
                  value={formData.scope}
                  onChange={(e) =>
                    setFormData({ ...formData, scope: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none resize-none"
                  placeholder="Describe the work, services, or deliverables..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Additional Instructions (for AI)
                </label>
                <textarea
                  value={formData.additionalInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, additionalInstructions: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#D4AF37] focus:outline-none resize-none"
                  placeholder="e.g., Include a non-compete clause..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Generator */}
        <div className="space-y-4">
          <AIGenerator
            onGenerate={async () => {
              await handleGenerate();
              return generatedContent;
            }}
            isGenerating={isGenerating}
            generatedContent={generatedContent}
            brandContext={{
              brandName: 'Your Brand',
              toneOfVoice: 'Professional',
            }}
            buttonText="Generate Contract with AI"
          />

          {/* Actions */}
          {generatedContent && (
            <div className="flex items-center gap-3">
              <DocumentExport
                content={generatedContent}
                filename={formData.documentTitle || 'contract'}
                format="txt"
              />

              <button
                onClick={handleSaveAndView}
                disabled={!savedDocId}
                className="flex-1 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold hover:bg-[#FFD700] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    View Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
