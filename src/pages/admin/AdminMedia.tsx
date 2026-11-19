import React, { useCallback, useEffect, useState } from 'react';
import { Copy, Trash2, Upload } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { MediaAsset } from '../../types/cms';

export function AdminMedia() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/media', { credentials: 'include' });
    if (res.ok) setAssets(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await adminFetch('/api/admin/media/upload', {
          method: 'POST',
          body: JSON.stringify({
            originalName: file.name,
            mimeType: file.type,
            base64Data: String(reader.result || ''),
            altText: { ar: file.name, en: file.name }
          })
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error || 'Upload failed.');
        } else {
          setAssets(json);
        }
      } catch {
        setErrorMsg('Upload error.');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const copyUrl = async (asset: MediaAsset) => {
    await navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await adminFetch(`/api/admin/media/${encodeURIComponent(deleteTarget.id)}`, {
      method: 'DELETE'
    });
    setDeleteTarget(null);
    if (res.ok) setAssets(await res.json());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminMedia')}</h1>

        <label
          className="px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: gold, color: '#111111' }}
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? '...' : lang === 'ar' ? 'رفع صورة (PNG/JPG/WebP)' : 'Upload Image (PNG/JPG/WebP)'}</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="rounded-2xl border overflow-hidden flex flex-col"
            style={{ backgroundColor: cardBg, borderColor: borderCol }}
          >
            <div className="aspect-video bg-black/30 overflow-hidden">
              <img
                src={asset.url}
                alt={asset.originalName}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold truncate">{asset.originalName}</div>
                <div className="text-xs font-mono-tabular truncate" style={{ color: muted }}>
                  {(asset.sizeBytes / 1024).toFixed(1)} KB · {asset.mimeType}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void copyUrl(asset)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === asset.id ? 'Copied' : 'Copy URL'}</span>
                </button>
                <button
                  type="button"
                  aria-label={`${t('delete')} ${asset.originalName}`}
                  onClick={() => setDeleteTarget(asset)}
                  className="p-1.5 rounded-lg border text-red-400 cursor-pointer"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('confirmDelete')}
        description={deleteTarget ? `${t('delete')}: ${deleteTarget.originalName}` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
