/**
 * Backup & Restore utilities for OMKAR JWELLERS
 * Exports/imports all app data as JSON.
 * Auto-backup triggers once per 24 hours on app open (localStorage-based).
 */

export const BACKUP_LAST_KEY = "omkar_last_backup";
export const BACKUP_LIST_KEY = "omkar_backup_list";
const MAX_BACKUPS = 7;

export interface BackupMeta {
  id: string;
  timestamp: string; // ISO string
  label: string;
  sizeKb: number;
  createdBy: string; // "auto" or phone number
  status: "success" | "failed";
  failReason?: string;
}

export interface BackupSnapshot {
  version: 1;
  createdAt: string;
  createdBy: string;
  shopName: string;
  customers: unknown[];
  invoices: unknown[];
  udharLedger: unknown[];
  jobOrders: unknown[];
  repairOrders: unknown[];
  customOrders: unknown[];
  users: unknown[];
  settings: unknown;
  checksum: string;
}

function simpleChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32-bit
  }
  return Math.abs(hash).toString(16);
}

export function buildBackupBlob(
  data: Omit<BackupSnapshot, "checksum" | "version">,
): { blob: BackupSnapshot; sizeKb: number } {
  const withoutChecksum = { version: 1 as const, ...data, checksum: "" };
  const raw = JSON.stringify(withoutChecksum);
  const checksum = simpleChecksum(raw);
  const blob: BackupSnapshot = { ...withoutChecksum, checksum };
  const sizeKb = Math.round(JSON.stringify(blob).length / 1024);
  return { blob, sizeKb };
}

export function validateBackupBlob(raw: unknown): {
  valid: boolean;
  reason?: string;
} {
  if (!raw || typeof raw !== "object") {
    return { valid: false, reason: "Invalid file format" };
  }
  const snap = raw as BackupSnapshot;
  if (snap.version !== 1) {
    return { valid: false, reason: "Unknown backup version" };
  }
  if (!snap.createdAt || !Array.isArray(snap.customers)) {
    return { valid: false, reason: "Missing required backup fields" };
  }
  // Verify checksum
  const stored = snap.checksum;
  const forCheck = { ...snap, checksum: "" };
  const computed = simpleChecksum(JSON.stringify(forCheck));
  if (stored !== computed) {
    return {
      valid: false,
      reason: "Backup file is corrupted (checksum mismatch)",
    };
  }
  return { valid: true };
}

export function getBackupList(): BackupMeta[] {
  try {
    const raw = localStorage.getItem(BACKUP_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BackupMeta[];
  } catch {
    return [];
  }
}

export function saveBackupMeta(meta: BackupMeta) {
  const list = getBackupList();
  // Store backup data under its own key
  const updated = [meta, ...list].slice(0, MAX_BACKUPS);
  // Remove old excess backups' data
  const removedIds = list.slice(MAX_BACKUPS - 1).map((m) => m.id);
  for (const id of removedIds) {
    localStorage.removeItem(`omkar_backup_data_${id}`);
  }
  localStorage.setItem(BACKUP_LIST_KEY, JSON.stringify(updated));
  localStorage.setItem(BACKUP_LAST_KEY, meta.timestamp);
}

export function storeBackupData(id: string, blob: BackupSnapshot) {
  try {
    localStorage.setItem(`omkar_backup_data_${id}`, JSON.stringify(blob));
  } catch {
    // localStorage quota -- silently fail
  }
}

export function getStoredBackupData(id: string): BackupSnapshot | null {
  try {
    const raw = localStorage.getItem(`omkar_backup_data_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as BackupSnapshot;
  } catch {
    return null;
  }
}

export function downloadBackupFile(blob: BackupSnapshot, _label: string) {
  const date = new Date(blob.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `omkar-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
  const json = JSON.stringify(blob, null, 2);
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function shouldAutoBackup(): boolean {
  const last = localStorage.getItem(BACKUP_LAST_KEY);
  if (!last) return true;
  const diff = Date.now() - new Date(last).getTime();
  return diff > 24 * 60 * 60 * 1000; // 24 hours
}

export function formatBackupTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
