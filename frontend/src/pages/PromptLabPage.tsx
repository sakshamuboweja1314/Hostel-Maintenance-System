import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Play, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Cpu,
  Layers,
  Code2
} from 'lucide-react';
import { api } from '../services/api';
import { PromptTemplateResponse, PromptAnalyzeResponse } from '../types';

const STRATEGY_DETAILS: Record<string, { title: string; unit: string; concept: string }> = {
  zero_shot: {
    title: 'Zero-Shot Prompting',
    unit: 'Unit III & IV',
    concept: 'Direct instruction without exemplar context pairs. Evaluates foundational instruction adherence of the pretrained LM.'
  },
  one_shot: {
    title: 'One-Shot Prompting',
    unit: 'Unit IV',
    concept: 'Supplies exactly one canonical input-output exemplar to anchor output phrasing, tone, and schema compliance.'
  },
  few_shot: {
    title: 'Few-Shot In-Context Learning',
    unit: 'Unit IV',
    concept: 'Provides multiple balanced exemplars spanning multiple categories and urgencies without weight fine-tuning.'
  },
  role_prompt: {
    title: 'Role Prompting (Persona Conditioning)',
    unit: 'Unit IV',
    concept: 'Conditions model generation by assigning the persona of a Chief University Safety Warden to prioritize structural/life safety.'
  },
  structured_json: {
    title: 'Structured Output Generation (JSON)',
    unit: 'Unit III & IV',
    concept: 'Constrains LLM generation to produce validated, type-safe JSON blocks suitable for programmatic backend parsing.'
  }
};

const SAMPLE_COMPLAINTS = [
  'Heavy water leakage from bathroom ceiling onto the electrical switchboard in Room 204.',
  'Wi-Fi has stopped working across our entire block right before the placement test.',
  'The study chair backrest screw has come loose and squeaks.',
  'Dead rodent decomposing in the 2nd floor air conditioning duct causing severe odor.'
];

export const PromptLabPage: React.FC = () => {
  const [templateData, setTemplateData] = useState<PromptTemplateResponse | null>(null);
  const [strategy, setStrategy] = useState<string>('few_shot');
  const [complaintText, setComplaintText] = useState<string>(SAMPLE_COMPLAINTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptAnalyzeResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPromptTemplates().then(setTemplateData).catch(console.error);
  }, []);

  const handleAnalyze = async () => {
    if (!complaintText.trim()) return;
    try {
      setLoading(true);
      const res = await api.analyzePrompt(complaintText, strategy);
      setResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTemplate = templateData?.templates[strategy] || '';
  const compiledPreview = currentTemplate.replace('{complaint}', complaintText);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          Prompt Engineering Laboratory (Unit III & IV)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore generative LLM conditioning techniques including In-Context Learning (Zero-Shot, One-Shot, Few-Shot), Role Persona Conditioning, and Structured JSON Schema Enforcement.
        </p>
      </div>

      {/* Strategy Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(STRATEGY_DETAILS).map(([key, info]) => {
          const isSelected = strategy === key;
          return (
            <button
              key={key}
              onClick={() => { setStrategy(key); setResult(null); }}
              className={`p-3.5 rounded-xl border text-left transition ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded-xs">
                  {info.unit}
                </span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
              </div>
              <p className="font-bold text-slate-900 text-xs mt-1">{info.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                {info.concept}
              </p>
            </button>
          );
        })}
      </div>

      {/* Playground Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Complaint Input & Config */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-blue-600" />
            1. Select or Enter Test Complaint
          </h2>

          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_COMPLAINTS.map((sample, i) => (
              <button
                key={i}
                onClick={() => setComplaintText(sample)}
                className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Type custom complaint for prompt analysis..."
            className="w-full text-xs rounded-lg border border-slate-300 p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />

          <div className="pt-2">
            <button
              onClick={handleAnalyze}
              disabled={loading || !complaintText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              {loading ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Compiling & Evaluating Prompt Strategy...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Prompt Strategy
                </>
              )}
            </button>
          </div>

          {/* Compiled Prompt Template Preview */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Compiled Prompt Sent to LLM Context:
              </span>
              <button
                onClick={() => handleCopy(compiledPreview)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
              {compiledPreview}
            </pre>
          </div>
        </div>

        {/* Right Column: Execution Output & Academic Explanation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-emerald-600" />
            2. LLM Execution & Academic Verification
          </h2>

          {result ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Ollama Status Banner */}
              <div className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                result.ollama_available
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {result.ollama_available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {result.ollama_available 
                      ? 'Local Ollama LLM Execution Active' 
                      : 'Educational Demonstration Mode (No paid cloud APIs)'}
                  </p>
                  <p className="mt-0.5 leading-relaxed text-[11px]">
                    {result.educational_notes}
                  </p>
                </div>
              </div>

              {/* Output block */}
              {result.llm_output ? (
                <div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Live Ollama LLM Response:
                  </span>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-slate-800">
                    {result.llm_output}
                  </pre>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">
                    Expected Behavioral Characteristic:
                  </p>
                  <p className="leading-relaxed">
                    Under <strong>{STRATEGY_DETAILS[result.prompt_strategy]?.title}</strong>, the language model conditions its next-token probabilities P(w_t | w_&lt;t, Context) on the structured prompt provided.
                  </p>
                  {result.prompt_strategy === 'structured_json' && (
                    <p className="font-mono text-[11px] bg-white p-2 rounded-sm border border-slate-200 text-blue-900">
                      {`{\n  "predicted_category": "Electrical",\n  "predicted_urgency": "Critical",\n  "priority_score": 98.5,\n  "priority_explanation": "Direct hazard identified",\n  "requires_immediate_dispatch": true\n}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              Click "Execute Prompt Strategy" to compile and analyze the prompt engineering strategy.
            </div>
          )}

          {/* Academic Notes Box */}
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1.5">
            <span className="font-bold block">Academic Syllabus Integrity Note:</span>
            <p className="text-[11px] leading-relaxed text-blue-800/90">
              The primary hostel maintenance prioritization system runs entirely on fine-tuned <strong>DistilBERT</strong> (Unit III & IV). This Prompt Engineering Lab demonstrates prompt taxonomy from Unit IV without requiring cloud APIs or commercial subscriptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
