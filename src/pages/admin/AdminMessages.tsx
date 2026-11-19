import { useCallback, useEffect, useState } from 'react';
import { Archive, Check, Mail, MailOpen, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdmin } from '../../context/AdminContext';
import type { ContactMessage, MessageStatus } from '../../types/cms';

export function AdminMessages() {
  const { mode, lang, t, adminFetch } = useAdmin();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | MessageStatus>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/messages', { credentials: 'include' });
    if (res.ok) {
      const list = (await res.json()) as ContactMessage[];
      setMessages(list);
      setSelectedId((prev) => (prev && list.some((m) => m.id === prev) ? prev : list[0]?.id ?? null));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isDark = mode === 'dark';
  const cardBg = isDark ? '#121216' : '#FFFFFF';
  const pageBg = isDark ? '#09090B' : '#F4F4F6';
  const borderCol = isDark ? '#25252C' : '#E2E2E8';
  const muted = isDark ? '#9E9EA8' : '#646470';
  const gold = isDark ? '#D4AF37' : '#B68914';

  const updateStatus = async (id: string, status: MessageStatus) => {
    const res = await adminFetch(`/api/admin/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setMessages(await res.json());
    }
  };

  const selectMessage = async (msg: ContactMessage) => {
    setSelectedId(msg.id);
    if (msg.status === 'unread') {
      await updateStatus(msg.id, 'read');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await adminFetch(`/api/admin/messages/${encodeURIComponent(deleteTarget.id)}`, {
      method: 'DELETE'
    });
    setDeleteTarget(null);
    if (res.ok) {
      const nextList = (await res.json()) as ContactMessage[];
      setMessages(nextList);
      setSelectedId(nextList[0]?.id ?? null);
    }
  };

  const filtered = messages.filter((m) => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold m-0">{t('navAdminMessages')}</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 opacity-60" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl border text-sm"
            style={{ backgroundColor: cardBg, borderColor: borderCol, color: 'inherit' }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'unread', 'read', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: filterStatus === st ? gold : cardBg,
                color: filterStatus === st ? '#111111' : 'inherit',
                borderColor: filterStatus === st ? gold : borderCol
              }}
            >
              {st === 'all'
                ? t('all')
                : st === 'unread'
                  ? t('msgUnread')
                  : st === 'read'
                    ? t('msgRead')
                    : t('msgArchived')}
            </button>
          ))}
        </div>
      </div>

      {/* Hybrid View: List on left/start, Detail Side Panel on right/end */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div
          className="lg:col-span-5 rounded-2xl border divide-y overflow-hidden"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: muted }}>
              —
            </div>
          ) : (
            filtered.map((msg) => {
              const active = msg.id === selectedId;
              return (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => void selectMessage(msg)}
                  className="w-full text-start p-4 cursor-pointer transition-colors block border-0"
                  style={{
                    backgroundColor: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                    color: 'inherit',
                    borderColor: borderCol
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm truncate flex items-center gap-2">
                      {msg.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: gold }} />
                      )}
                      <span>{msg.name}</span>
                    </span>
                    <span className="font-mono-tabular text-[11px] shrink-0" style={{ color: muted }}>
                      {new Date(msg.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                  <div className="text-xs font-semibold truncate">{msg.subject}</div>
                  <div className="text-xs truncate mt-0.5" style={{ color: muted }}>
                    {msg.message}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Side Detail Panel */}
        <div
          className="lg:col-span-7 rounded-2xl border p-5 sm:p-6 min-h-[340px]"
          style={{ backgroundColor: cardBg, borderColor: borderCol }}
        >
          {!selected ? (
            <div className="h-64 grid place-items-center text-sm text-center" style={{ color: muted }}>
              <div className="space-y-2">
                <Mail className="w-8 h-8 mx-auto opacity-50" />
                <p className="m-0">{t('selectMessagePrompt')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b" style={{ borderColor: borderCol }}>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold m-0">{selected.subject}</h2>
                  <div className="text-xs space-x-2 rtl:space-x-reverse" style={{ color: muted }}>
                    <span className="font-semibold" style={{ color: gold }}>{selected.name}</span>
                    <span>·</span>
                    <a href={`mailto:${selected.email}`} className="no-underline" style={{ color: 'inherit' }}>
                      {selected.email}
                    </a>
                    <span>·</span>
                    <span className="font-mono-tabular">
                      {new Date(selected.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-1.5 rounded-lg border cursor-pointer"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent', color: muted }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                className="p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap"
                style={{ backgroundColor: pageBg, borderColor: borderCol }}
              >
                {selected.message}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {selected.status !== 'read' ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(selected.id, 'read')}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('markRead')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void updateStatus(selected.id, 'unread')}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: borderCol, backgroundColor: 'transparent', color: 'inherit' }}
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>{t('markUnread')}</span>
                  </button>
                )}

                {selected.status !== 'archived' ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(selected.id, 'archived')}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{t('archive')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void updateStatus(selected.id, 'read')}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ borderColor: borderCol, backgroundColor: 'transparent', color: gold }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('restore')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteTarget(selected)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer text-red-400 ms-auto"
                  style={{ borderColor: borderCol, backgroundColor: 'transparent' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('delete')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('confirmDelete')}
        description={deleteTarget ? `${t('delete')}: ${deleteTarget.name} — ${deleteTarget.subject}` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
