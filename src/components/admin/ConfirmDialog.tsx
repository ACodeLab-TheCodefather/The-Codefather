import { AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = true,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  const { t, mode } = useAdmin();
  if (!open) return null;

  const isDark = mode === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4"
        style={{
          backgroundColor: isDark ? '#141417' : '#FFFFFF',
          borderColor: isDark ? '#2A2A32' : '#E2E2E6',
          color: isDark ? '#F5F5F7' : '#111115'
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
            style={{
              backgroundColor: destructive ? 'rgba(220, 38, 38, 0.14)' : 'rgba(212, 175, 55, 0.16)',
              color: destructive ? '#EF4444' : '#D4AF37'
            }}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 id="confirm-dialog-title" className="text-base font-bold m-0">
              {title}
            </h3>
            <p className="text-sm m-0 opacity-80">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer"
            style={{
              borderColor: isDark ? '#2E2E36' : '#D4D4DA',
              backgroundColor: 'transparent',
              color: isDark ? '#D1D1D6' : '#3F3F46'
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer border-0"
            style={{
              backgroundColor: destructive ? '#DC2626' : '#D4AF37',
              color: destructive ? '#FFFFFF' : '#111111'
            }}
          >
            {confirmLabel || t('confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
