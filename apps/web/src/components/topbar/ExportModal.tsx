import { useState, useEffect, useCallback } from 'react';
import { X, FileCode, Copy, Check, Download, Image, FileJson, Camera } from 'lucide-react';
import { useArchitectureStore } from '../../stores/architectureStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { apiFetch } from '../../lib/api';
import { toPng, toSvg } from 'html-to-image';

type ExportFormat = 'docker-compose' | 'kubernetes' | 'terraform' | 'json' | 'svg' | 'png';

export default function ExportModal() {
  const setShowExportModal = useUIStore((s) => s.setShowExportModal);
  const getArchitectureData = useArchitectureStore((s) => s.getArchitectureData);
  const architectureName = useProjectStore((s) => s.architectureName);
  const [format, setFormat] = useState<ExportFormat>('docker-compose');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Image export state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Generate infra config output for docker-compose, kubernetes, terraform
  useEffect(() => {
    if (format === 'json' || format === 'svg' || format === 'png') return;

    const generate = async () => {
      setLoading(true);
      const data = getArchitectureData();
      const architecture = {
        id: 'export',
        name: 'Export',
        nodes: data.nodes,
        edges: data.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        const res = await apiFetch(`/api/generate/${format}`, {
          method: 'POST',
          body: JSON.stringify({ architecture }),
        });
        const result = await res.json();
        setOutput(result.output);
      } catch {
        setOutput('Error generating configuration');
      }
      setLoading(false);
    };
    generate();
  }, [format, getArchitectureData]);

  // Generate JSON output
  useEffect(() => {
    if (format !== 'json') return;
    const data = getArchitectureData();
    const jsonExport = {
      name: architectureName,
      nodes: data.nodes,
      edges: data.edges,
      exportedAt: new Date().toISOString(),
    };
    setOutput(JSON.stringify(jsonExport, null, 2));
  }, [format, getArchitectureData, architectureName]);

  // Reset image data when switching away from image tabs
  useEffect(() => {
    if (format !== 'svg' && format !== 'png') {
      setImageDataUrl(null);
    }
  }, [format]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadDataUrl = useCallback((dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }, []);

  const handleCaptureCanvas = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement | null;
    if (!el) return;

    setCapturing(true);
    try {
      const options = {
        backgroundColor: '#0a0e1a',
        quality: 1,
        pixelRatio: 2,
      };

      if (format === 'svg') {
        const dataUrl = await toSvg(el, options);
        setImageDataUrl(dataUrl);
      } else {
        const dataUrl = await toPng(el, options);
        setImageDataUrl(dataUrl);
      }
    } catch {
      setImageDataUrl(null);
    }
    setCapturing(false);
  }, [format]);

  const safeName = architectureName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  const infraFormats: Array<{ id: ExportFormat; label: string }> = [
    { id: 'docker-compose', label: 'Docker Compose' },
    { id: 'kubernetes', label: 'Kubernetes' },
    { id: 'terraform', label: 'Terraform' },
  ];

  const dataFormats: Array<{ id: ExportFormat; label: string; icon: React.ReactNode }> = [
    { id: 'json', label: 'JSON', icon: <FileJson size={11} /> },
    { id: 'svg', label: 'SVG', icon: <Image size={11} /> },
    { id: 'png', label: 'PNG', icon: <Image size={11} /> },
  ];

  const isImageFormat = format === 'svg' || format === 'png';
  const isCodeFormat = !isImageFormat;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowExportModal(false)}>
      <div className="bg-surface-800 border border-border rounded-xl w-[720px] max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCode size={16} className="text-accent-cyan" />
            <span className="text-sm font-semibold">Export Architecture</span>
          </div>
          <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-surface-600 rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex border-b border-border px-4 gap-0 items-center">
          {/* Infra config tabs */}
          {infraFormats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                format === f.id
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-5 bg-border mx-2" />

          {/* Data/image export tabs */}
          {dataFormats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                format === f.id
                  ? 'border-accent-cyan text-accent-cyan'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Action buttons for code formats */}
          {isCodeFormat && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 my-1 rounded text-xs hover:bg-surface-600 transition-colors"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  const ext = format === 'json' ? 'json' : format === 'terraform' ? 'tf' : 'yml';
                  const mime = format === 'json' ? 'application/json' : 'text/plain';
                  handleDownload(output, `${safeName}.${ext}`, mime);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 my-1 rounded text-xs hover:bg-surface-600 transition-colors"
              >
                <Download size={12} />
                Download
              </button>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex-1 overflow-auto p-4">
          {isImageFormat ? (
            /* SVG / PNG capture view */
            <div className="flex flex-col items-center gap-4">
              {!imageDataUrl ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Camera size={32} className="text-gray-500" />
                  <p className="text-sm text-gray-400">
                    Capture the current canvas as {format.toUpperCase()}
                  </p>
                  <button
                    onClick={handleCaptureCanvas}
                    disabled={capturing}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-accent-cyan text-white rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {capturing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        Capture Canvas
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {/* Preview */}
                  <div className="border border-border rounded-lg overflow-hidden bg-surface-900">
                    <img
                      src={imageDataUrl}
                      alt="Architecture diagram"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setImageDataUrl(null)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Re-capture
                    </button>
                    <button
                      onClick={() => handleDownloadDataUrl(imageDataUrl, `${safeName}.${format}`)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-accent-cyan text-white rounded-lg hover:brightness-110 transition-colors"
                    >
                      <Download size={14} />
                      Download {format.toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-xs">Generating...</div>
          ) : (
            <pre className="text-xs font-mono text-gray-300 whitespace-pre leading-relaxed">{output}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
