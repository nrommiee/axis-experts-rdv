"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import type { DactyloOrder } from "@/lib/odoo/dactylo";
import { DactyloHeader } from "@/components/dactylo/DactyloHeader";
import { DactyloOrdersList } from "@/components/dactylo/DactyloOrdersList";
import { DactyloSendPanel } from "@/components/dactylo/DactyloSendPanel";
import { DactyloConfirmModal } from "@/components/dactylo/DactyloConfirmModal";
import {
  DOCX_EXTENSION,
  DOCX_MIME,
  MAX_FILE_SIZE,
  MAX_FILES_PER_ROW,
  ZIP_MAGIC,
} from "@/components/dactylo/constants";
import type { RowStatus, SendRow } from "@/components/dactylo/types";

function newRow(): SendRow {
  return {
    id: crypto.randomUUID(),
    orderId: null,
    files: [],
    status: "idle",
  };
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} Mo`;
}

async function hasDocxMagic(file: File): Promise<boolean> {
  try {
    const buf = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buf);
    return (
      bytes.length === 4 &&
      bytes[0] === ZIP_MAGIC[0] &&
      bytes[1] === ZIP_MAGIC[1] &&
      bytes[2] === ZIP_MAGIC[2] &&
      bytes[3] === ZIP_MAGIC[3]
    );
  } catch {
    return false;
  }
}

async function filterValidDocxFiles(
  candidates: File[],
  existingNames: Set<string>
): Promise<{ accepted: File[]; rejections: string[] }> {
  const accepted: File[] = [];
  const rejections: string[] = [];
  const seenInBatch = new Set<string>();

  for (const f of candidates) {
    const name = f.name;
    if (!name.toLowerCase().endsWith(DOCX_EXTENSION)) {
      rejections.push(`${name} : extension non autorisée (seul .docx accepté)`);
      continue;
    }
    if (f.type && f.type !== DOCX_MIME) {
      rejections.push(`${name} : type MIME invalide`);
      continue;
    }
    if (f.size > MAX_FILE_SIZE) {
      rejections.push(`${name} : dépasse ${formatMb(MAX_FILE_SIZE)}`);
      continue;
    }
    if (existingNames.has(name) || seenInBatch.has(name)) {
      rejections.push(`${name} : déjà présent dans cette ligne`);
      continue;
    }
    const ok = await hasDocxMagic(f);
    if (!ok) {
      rejections.push(`${name} : fichier corrompu ou non .docx`);
      continue;
    }
    seenInBatch.add(name);
    accepted.push(f);
  }

  return { accepted, rejections };
}

export default function DactyloPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<DactyloOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [rows, setRows] = useState<SendRow[]>(() => [newRow()]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchOrders = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setOrdersLoading(true);
      else setOrdersRefreshing(true);
      setOrdersError(null);
      try {
        const res = await fetch("/api/dactylo/orders", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          orders: DactyloOrder[];
          count: number;
        };
        setOrders(data.orders);
      } catch (err) {
        console.error("[dactylo] fetch orders failed:", err);
        setOrdersError(
          "Impossible de récupérer les devis. Odoo est peut-être temporairement indisponible."
        );
      } finally {
        if (mode === "initial") setOrdersLoading(false);
        else setOrdersRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.push("/login");
        return;
      }
      setUserEmail(user.email ?? null);
      setSessionReady(true);
      await fetchOrders("initial");
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, fetchOrders]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, newRow()]);
  }, []);

  const handleRemoveRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }, []);

  const handleUpdateOrder = useCallback(
    (rowId: string, orderId: number | null) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, orderId } : r))
      );
    },
    []
  );

  const handleAddFiles = useCallback(
    async (rowId: string, incoming: File[]) => {
      const currentRow = rows.find((r) => r.id === rowId);
      if (!currentRow) return;

      const remainingSlots = MAX_FILES_PER_ROW - currentRow.files.length;
      if (remainingSlots <= 0) {
        toast.warning(`Maximum ${MAX_FILES_PER_ROW} fichiers par ligne.`);
        return;
      }

      const existingNames = new Set(currentRow.files.map((f) => f.name));
      const { accepted, rejections } = await filterValidDocxFiles(
        incoming,
        existingNames
      );

      let finalAccepted = accepted;
      if (accepted.length > remainingSlots) {
        finalAccepted = accepted.slice(0, remainingSlots);
        rejections.push(
          `Maximum ${MAX_FILES_PER_ROW} fichiers par ligne — ${
            accepted.length - remainingSlots
          } fichier(s) ignoré(s).`
        );
      }

      for (const msg of rejections) toast.error(msg);

      if (finalAccepted.length > 0) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId ? { ...r, files: [...r.files, ...finalAccepted] } : r
          )
        );
      }
    },
    [rows]
  );

  const handleRemoveFile = useCallback((rowId: string, fileIndex: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, files: r.files.filter((_, i) => i !== fileIndex) }
          : r
      )
    );
  }, []);

  const setAllRowsStatus = useCallback(
    (predicate: (r: SendRow) => boolean, status: RowStatus) => {
      setRows((prev) =>
        prev.map((r) =>
          predicate(r) ? { ...r, status, errorMessage: undefined } : r
        )
      );
    },
    []
  );

  const handleResetCompleted = useCallback(() => {
    setRows((prev) => {
      const kept = prev.filter(
        (r) => r.status !== "success" && r.status !== "error"
      );
      return kept.length > 0 ? kept : [newRow()];
    });
  }, []);

  const availableOrdersFor = useCallback(
    (rowId: string) => {
      const taken = new Set(
        rows
          .filter((r) => r.id !== rowId && r.orderId !== null)
          .map((r) => r.orderId as number)
      );
      return orders.filter((o) => !taken.has(o.id));
    },
    [orders, rows]
  );

  const validRows = useMemo(
    () => rows.filter((r) => r.orderId !== null && r.files.length > 0),
    [rows]
  );
  const totalFiles = useMemo(
    () => rows.reduce((n, r) => n + r.files.length, 0),
    [rows]
  );
  const hasUploadingRow = useMemo(
    () => rows.some((r) => r.status === "uploading" || r.status === "pending"),
    [rows]
  );
  const hasCompletedRow = useMemo(
    () => rows.some((r) => r.status === "success" || r.status === "error"),
    [rows]
  );
  const canSubmit =
    !hasUploadingRow &&
    rows.length > 0 &&
    validRows.length === rows.length &&
    rows.every((r) => r.status === "idle");

  const handleSubmitClick = useCallback(() => {
    if (!canSubmit) return;
    setConfirmOpen(true);
  }, [canSubmit]);

  const handleConfirm = useCallback(async () => {
    setConfirmOpen(false);

    const snapshot = validRows.map((r) => {
      const order = orders.find((o) => o.id === r.orderId);
      return {
        row_id: r.id,
        order_id: r.orderId as number,
        order_name: order?.name ?? `#${r.orderId}`,
        files: r.files,
      };
    });

    setAllRowsStatus((r) => r.status === "idle", "uploading");

    const formData = new FormData();
    formData.append(
      "payload",
      JSON.stringify({
        lines: snapshot.map((s) => ({
          order_id: s.order_id,
          order_name: s.order_name,
          file_count: s.files.length,
        })),
      })
    );
    snapshot.forEach((s, i) => {
      s.files.forEach((f, j) => formData.append(`files_${i}_${j}`, f, f.name));
    });

    type LineResult =
      | { order_id: number; order_name: string; success: true; attachment_ids: number[] }
      | { order_id: number; order_name: string; success: false; error: string };
    type BatchResponse = {
      results: LineResult[];
      summary: { total: number; succeeded: number; failed: number };
    };

    let data: BatchResponse | null = null;
    let networkError: string | null = null;

    try {
      const res = await fetch("/api/dactylo/upload-batch", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        let bodyError = "";
        try {
          const body = (await res.json()) as { error?: unknown };
          if (typeof body.error === "string") bodyError = body.error;
        } catch {
          // ignore JSON parse failure, use generic message below
        }
        networkError = bodyError || `Erreur serveur (${res.status})`;
      } else {
        data = (await res.json()) as BatchResponse;
      }
    } catch (err) {
      console.error("[dactylo] upload-batch failed:", err);
      networkError = "Erreur de connexion au serveur";
    }

    if (!data) {
      const msg = networkError ?? "Erreur de connexion au serveur";
      setRows((prev) =>
        prev.map((r) =>
          r.status === "uploading"
            ? { ...r, status: "error", errorMessage: msg }
            : r
        )
      );
      toast.error(msg);
      return;
    }

    const resultByOrderId = new Map<number, LineResult>();
    for (const r of data.results) resultByOrderId.set(r.order_id, r);

    setRows((prev) =>
      prev.map((r) => {
        if (r.status !== "uploading") return r;
        if (r.orderId === null) return r;
        const result = resultByOrderId.get(r.orderId);
        if (!result) {
          return {
            ...r,
            status: "error",
            errorMessage: "Résultat manquant pour ce devis",
          };
        }
        if (result.success) {
          return { ...r, status: "success", errorMessage: undefined };
        }
        return { ...r, status: "error", errorMessage: result.error };
      })
    );

    const { succeeded, failed, total } = data.summary;
    if (succeeded === total) {
      toast.success(
        `${succeeded} devis envoyé${succeeded > 1 ? "s" : ""} avec succès`
      );
    } else if (succeeded === 0) {
      toast.error("Aucun devis n'a pu être envoyé");
    } else {
      toast.info(
        `${succeeded} devis envoyé${succeeded > 1 ? "s" : ""}, ${failed} en erreur`
      );
    }

    fetchOrders("refresh");
  }, [validRows, orders, setAllRowsStatus, fetchOrders]);

  if (!sessionReady) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DactyloHeader
        userEmail={userEmail}
        hasUploadingRow={hasUploadingRow}
        onLogout={handleLogout}
      />
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="min-h-[60vh]">
            <DactyloOrdersList
              orders={orders}
              loading={ordersLoading}
              refreshing={ordersRefreshing}
              error={ordersError}
              onRefresh={() => fetchOrders("refresh")}
            />
          </div>
          <div className="min-h-[60vh]">
            <DactyloSendPanel
              rows={rows}
              orders={orders}
              ordersLoading={ordersLoading}
              totalFiles={totalFiles}
              canSubmit={canSubmit}
              hasUploadingRow={hasUploadingRow}
              hasCompletedRow={hasCompletedRow}
              availableOrdersFor={availableOrdersFor}
              onAddRow={handleAddRow}
              onRemoveRow={handleRemoveRow}
              onUpdateOrder={handleUpdateOrder}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onSubmitClick={handleSubmitClick}
              onResetCompleted={handleResetCompleted}
            />
          </div>
        </div>
      </main>
      <DactyloConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        rows={rows}
        orders={orders}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
