"use client";

import { useEffect, useRef, useState } from "react";

interface MessageDrawerProps {
  orderId: number | null;
  orderName: string;
  onClose: () => void;
}

interface Message {
  id: number;
  body: string;
  authorId: number | null;
  authorName: string;
  date: string;
  isFromClient: boolean;
  attachments?: { id: number; name: string; mimetype: string }[];
}

function stripHtml(html: string): string {
  if (!html) return "";
  // Remove tags, decode a few common entities, collapse whitespace.
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  const decoded = withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.replace(/\s+/g, " ").trim();
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 Mo
const MAX_ATTACHMENTS = 3;

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Chunked conversion to avoid "Maximum call stack size exceeded" on larger files.
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

function formatMessageDate(dateStr: string): string {
  if (!dateStr) return "";
  // Odoo dates come back as "YYYY-MM-DD HH:mm:ss" (UTC). Treat as UTC.
  const normalized = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T") + "Z";
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MessageDrawer({ orderId, orderName, onClose }: MessageDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);
    setInput("");
    setSendError(null);
    setAttachments([]);

    (async () => {
      try {
        const res = await fetch(`/api/odoo/messages?orderId=${orderId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Erreur lors du chargement");
        }
        const data: Message[] = await res.json();
        if (!cancelled) setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Mark as read when drawer opens
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const reloadMessages = async (id: number) => {
    try {
      setError(null);
      const res = await fetch(`/api/odoo/messages?orderId=${id}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors du chargement");
      }
      const data: Message[] = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const handleSend = async () => {
    if (orderId === null) return;
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const encodedAttachments = await Promise.all(
        attachments.map(async (file) => ({
          name: file.name,
          mimetype: file.type || "application/octet-stream",
          data: await fileToBase64(file),
        }))
      );

      const res = await fetch("/api/odoo/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          message: trimmed,
          attachments: encodedAttachments,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Erreur lors de l'envoi");
      }
      setInput("");
      setAttachments([]);
      await reloadMessages(orderId);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSending(false);
    }
  };

  if (orderId === null) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Drawer */}
      <aside
        className="absolute top-0 right-0 bg-white shadow-xl flex flex-col"
        style={{ width: "420px", height: "100vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-dark truncate pr-3">
            Messages — {orderName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-start">
                <div className="animate-pulse rounded-2xl bg-gray-100 h-16 w-3/4" />
              </div>
              <div className="flex justify-end">
                <div className="animate-pulse rounded-2xl bg-amber-50 h-12 w-2/3" />
              </div>
              <div className="flex justify-start">
                <div className="animate-pulse rounded-2xl bg-gray-100 h-20 w-4/5" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-sm text-red-500 py-8">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">
              Aucun message pour le moment
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => {
                const text = stripHtml(m.body);
                const dateLabel = formatMessageDate(m.date);
                return (
                  <li
                    key={m.id}
                    className={`flex ${m.isFromClient ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-2"
                      style={{
                        backgroundColor: m.isFromClient ? "#FEF3C7" : "#F3F4F6",
                      }}
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-semibold text-dark">
                          {m.authorName || "—"}
                        </span>
                        <span className="text-[10px] text-gray-400">{dateLabel}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {text}
                      </p>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {m.attachments.map((att) => {
                            const displayName =
                              att.name.length > 40
                                ? att.name.slice(0, 40) + "…"
                                : att.name;
                            return (
                              <div
                                key={att.id}
                                onClick={() =>
                                  window.open(
                                    `/api/odoo/attachments/download?id=${att.id}`
                                  )
                                }
                                title={att.name}
                                className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                              >
                                <svg
                                  className="w-3.5 h-3.5 flex-shrink-0 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                <span className="truncate">{displayName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer - compose */}
        <div className="border-t border-gray-100 px-5 py-3">
          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Votre message..."
            disabled={sending}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
          />

          {/* Hidden file input driven by the paperclip button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Reset so selecting the same file again still fires onChange.
              e.target.value = "";
              if (!file) return;
              if (file.size > MAX_ATTACHMENT_BYTES) {
                setSendError("Fichier trop volumineux (max 10 Mo)");
                return;
              }
              if (attachments.length >= MAX_ATTACHMENTS) {
                setSendError(`Maximum ${MAX_ATTACHMENTS} fichiers par message`);
                return;
              }
              setAttachments((prev) => [...prev, file]);
              setSendError(null);
            }}
          />

          {attachments.length > 0 && (
            <ul className="mt-2 space-y-1">
              {attachments.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700"
                >
                  <span className="truncate pr-2" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, i) => i !== idx))
                    }
                    disabled={sending}
                    className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 disabled:opacity-60"
                    aria-label={`Retirer ${file.name}`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {sendError && (
            <p className="mt-1 text-xs text-red-500">{sendError}</p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || attachments.length >= MAX_ATTACHMENTS}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Joindre un fichier"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || input.trim().length === 0}
              className="rounded-full px-5 py-2 text-sm font-semibold text-dark shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "#F5B800" }}
            >
              {sending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
