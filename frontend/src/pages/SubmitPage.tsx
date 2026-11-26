import React, { useState, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { api, resolveImageUrl } from '../services/api';
import { Complaint } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';

interface SubmitPageProps {
  onSuccess: (complaintId: number) => void;
}

const SAMPLE_PRESETS = [
  {
    title: 'Water Pipe Burst (Critical)',
    text: 'Severe water pipe burst in the corridor outside Room 204, water is gushing rapidly and flooding into student rooms!',
    room: 'Room 204',
    block: 'Block B'
  },
  {
    title: 'Switch Sparks (Critical / Safety)',
    text: 'Visible sparks and crackling sounds coming from the main switchboard in Room 112! Burning plastic smell detected.',
    room: 'Room 112',
    block: 'Block A'
  },
  {
    title: 'Floor Wi-Fi Down (High)',
    text: 'The Wi-Fi access point near Room 318 keeps rebooting every 2 minutes, dropping all connections before our midnight project deadline.',
    room: 'Room 318',
    block: 'Block C'
  },
  {
    title: 'Dripping Faucet (Medium)',
    text: 'The bathroom tap in Room 104 is dripping slowly but continuously throughout the night, wasting water.',
    room: 'Room 104',
    block: 'Boys Hostel 3'
  },
  {
    title: 'Study Table Scratch (Low)',
    text: 'Small cosmetic scratch on the laminate finish of the study table in Room 411.',
    room: 'Room 411',
    block: 'Block D'
  }
];

export const SubmitPage: React.FC<SubmitPageProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [complaintText, setComplaintText] = useState('');
  const [studentName, setStudentName] = useState(user?.name || '');
  const [roomNumber, setRoomNumber] = useState(user?.roomNumber || '');
  const [hostelBlock, setHostelBlock] = useState(user?.hostelBlock || 'Block A');

  // Photo Proof State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, WEBP, etc.)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      setError('Please provide a complaint description.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Step 1: Upload image if selected
      let uploadedImageUrl: string | null = null;
      if (selectedFile) {
        try {
          const uploadRes = await api.uploadImage(selectedFile);
          uploadedImageUrl = uploadRes.image_url;
        } catch (uploadErr: any) {
          console.warn('Image upload error:', uploadErr);
          // If upload fails, continue without blocking complaint creation
        }
      }

      // Step 2: Submit complaint to backend with edge NLP inference
      const result = await api.submitComplaint({
        complaint_text: complaintText.trim(),
        student_name: studentName.trim() || undefined,
        room_number: roomNumber.trim() || undefined,
        hostel_block: hostelBlock || undefined,
        image_url: uploadedImageUrl
      });
      setSubmittedComplaint(result);
    } catch (err: any) {
      setError(err.message || 'Error executing edge NLP inference.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setComplaintText(preset.text);
    setRoomNumber(preset.room);
    setHostelBlock(preset.block);
    setSubmittedComplaint(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Submit Maintenance Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Describe the problem in plain English and attach photo proof. Our local DistilBERT Transformer models will semantically categorize and prioritize it instantly without cloud dependencies.
        </p>
      </div>

      {/* Preset Demonstrations bar */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
        <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block mb-2">
          🎯 Quick Viva / Demo Test Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-xs bg-white border border-blue-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 px-3 py-1.5 rounded-lg shadow-2xs font-medium transition"
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Complaint Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="E.g., The bathroom geyser valve in room 204 is leaking boiling hot water and the floor is flooding..."
                className="w-full text-sm rounded-lg border border-slate-300 p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                No manual category selection required. The fine-tuned Transformer determines category and urgency automatically.
              </span>
            </div>

            {/* Photo Proof Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                Attach Photo Proof (Visual Evidence)
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="complaint-photo-upload"
              />

              {!previewUrl ? (
                <label
                  htmlFor="complaint-photo-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 sm:p-6 cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition group"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-600 transition mb-1.5" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition">
                    Click to upload photo evidence
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPG, PNG, WEBP (stored locally on edge server)
                  </span>
                </label>
              ) : (
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-4">
                  <img
                    src={previewUrl}
                    alt="Proof preview"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                  <div className="grow min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile?.name || 'Attached Photo Proof'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''} • Ready to store in record
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Visual proof attached
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Room No. (Optional)</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hostel Block</label>
                <select
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Block A">Block A</option>
                  <option value="Block B">Block B</option>
                  <option value="Block C">Block C</option>
                  <option value="Block D">Block D</option>
                  <option value="Boys Hostel 3">Boys Hostel 3</option>
                  <option value="Girls Hostel 2">Girls Hostel 2</option>
                  <option value="North Wing">North Wing</option>
                  <option value="South Wing">South Wing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Student Name (Optional)</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !complaintText.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition"
              >
                {submitting ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    Running Local Edge Transformer Inference...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Analyze & Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Explanatory Card */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              How Edge NLP Works Here
            </h3>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">1.</span>
                <span><strong>Tokenizer:</strong> Input text is tokenized into WordPieces with attention mask.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">2.</span>
                <span><strong>DistilBERT Encoder:</strong> 6 Transformer layers compute multi-head self-attention.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">3.</span>
                <span><strong>Dual Heads:</strong> Softmax computes category probability (6 classes) and urgency probability (4 classes).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">4.</span>
                <span><strong>Priority Formula:</strong> <code>Priority = Urgency Weight × Urgency Confidence</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 shrink-0">5.</span>
                <span><strong>Photo Proof Stored:</strong> Attached image is securely linked in the record for administrative verification.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Inference Result Card (Displays immediately after submission) */}
      {submittedComplaint && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-5 sm:p-6 shadow-md space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Complaint Registered #{submittedComplaint.id}
              </h2>
            </div>
            <button
              onClick={() => onSuccess(submittedComplaint.id)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Open in Queue Management
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Category */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Detected Category
              </span>
              <p className="font-bold text-slate-900 text-sm">{submittedComplaint.predicted_category}</p>
              <span className="text-xs text-blue-600 font-medium">
                {(submittedComplaint.category_confidence * 100).toFixed(1)}% confidence
              </span>
            </div>

            {/* Urgency */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Predicted Urgency
              </span>
              <Badge type="urgency" value={submittedComplaint.final_urgency} size="sm" />
              <span className="text-xs text-slate-500 font-medium block mt-1">
                {(submittedComplaint.urgency_confidence * 100).toFixed(1)}% confidence
              </span>
            </div>

            {/* Priority Score */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                Priority Score
              </span>
              <p className="font-black text-2xl text-blue-900 font-mono">
                {submittedComplaint.priority_score.toFixed(2)}
              </p>
              <span className="text-[11px] text-blue-600">Scale: 0 – 100.0</span>
            </div>

            {/* Status */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Workflow Status
              </span>
              <Badge type="status" value={submittedComplaint.status} size="sm" />
              <span className="text-xs text-slate-400 block mt-1">Ready in queue</span>
            </div>
          </div>

          {/* Attached Photo Proof in Result Card */}
          {submittedComplaint.image_url && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
              <img
                src={resolveImageUrl(submittedComplaint.image_url)}
                alt="Submitted photo proof"
                className="w-16 h-16 object-cover rounded-md border border-slate-200 shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  Photo Proof Attached & Stored
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visual evidence has been securely registered with this complaint and is viewable in the Complaint Queue.
                </p>
              </div>
            </div>
          )}

          {/* Transparent Explanation */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Transparent Prioritization Rationale:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-mono">
              {submittedComplaint.priority_reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
