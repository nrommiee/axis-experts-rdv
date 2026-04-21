export type RowStatus = "idle" | "pending" | "uploading" | "success" | "error";

export interface SendRow {
  id: string;
  orderId: number | null;
  files: File[];
  status: RowStatus;
  errorMessage?: string;
}
