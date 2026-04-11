"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (orderId === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);

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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
