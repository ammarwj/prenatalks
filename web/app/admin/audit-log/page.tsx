"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { AuditChangeList } from "@/components/admin/audit-change-list";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { TablePagination } from "@/components/admin/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiGetWithMeta, ApiRequestError } from "@/lib/api-client";
import type { AuditLogEntry, PaginationMeta } from "@/lib/types";

type AuditMeta = PaginationMeta & {
  actions: Record<string, string>;
  model_types: Record<string, string>;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Audit log — PRD §9 F-14 (khusus Super Admin).
 *
 * Halaman sendiri, bukan seksi di `/admin/pengaturan` seperti sitemap §8:
 * tabel berpaginasi dengan filternya sendiri berebut ruang dengan form
 * pengaturan. Tetap dijangkau lewat tautan dari halaman pengaturan.
 */
export default function AuditLogPage() {
  const { isSuperAdmin } = useSuperAdminGuard();

  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [action, setAction] = useState("all");
  const [modelType, setModelType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (action !== "all") params.set("action", action);
    if (modelType !== "all") params.set("model_type", modelType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [action, modelType, from, to, page]);

  const load = useCallback(async () => {
    setLoadError(null);
    setIsFetching(true);
    try {
      const result = await apiGetWithMeta<AuditLogEntry[], AuditMeta>(`/admin/audit-logs?${query}`);
      setLogs(result.data);
      setMeta(result.meta ?? null);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat audit log.");
      setLogs([]);
    } finally {
      setIsFetching(false);
    }
  }, [query]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <SuperAdminRestricted description="Audit log hanya bisa diakses oleh Super Admin. Catatan ini berisi jejak siapa mengubah apa dan kapan." />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Audit Log</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Jejak perubahan yang dilakukan admin: siapa, apa, dan kapan. Catatan ini tidak bisa
          disunting atau dihapus dari panel.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={action}
          onValueChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-40 rounded-xl" aria-label="Filter aksi">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua aksi</SelectItem>
            {Object.entries(meta?.actions ?? {}).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={modelType}
          onValueChange={(value) => {
            setModelType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-48 rounded-xl" aria-label="Filter jenis data">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua jenis data</SelectItem>
            {Object.entries(meta?.model_types ?? {}).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="from" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Dari tanggal
            </label>
            <DatePicker
              id="from"
              value={from}
              max={to || undefined}
              onChange={(value) => {
                setFrom(value);
                setPage(1);
              }}
              className="w-44"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs font-semibold text-muted-foreground">
              Sampai
            </label>
            <DatePicker
              id="to"
              value={to}
              min={from || undefined}
              onChange={(value) => {
                setTo(value);
                setPage(1);
              }}
              className="w-44"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {logs === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada catatan yang cocok dengan filter Anda.
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-white p-2 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pelaku</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Perubahan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <>
                        <span className="block font-semibold text-foreground">{log.user.name}</span>
                        <span className="block text-xs text-muted-foreground">{log.user.email}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Akun sudah dihapus</span>
                    )}
                    {log.ip && (
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {log.ip}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.action === "deleted" ? "outline" : "default"}>
                      {log.action_label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="block font-semibold text-foreground">{log.model_label}</span>
                    {log.model_id && (
                      <span className="block text-xs text-muted-foreground">#{log.model_id}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <AuditChangeList action={log.action} changes={log.changes} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && (
            <div className="px-3 pb-2">
              <TablePagination meta={meta} onPageChange={setPage} disabled={isFetching} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
