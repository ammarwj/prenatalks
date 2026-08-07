"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { ResponseDistributionChart } from "@/components/admin/response-distribution-chart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDownload, apiGet, apiGetWithMeta, apiPost, ApiRequestError } from "@/lib/api-client";
import type {
  AdminForm,
  AdminFormExport,
  AdminFormSubmission,
  FormExportFormat,
  FormResponseSummary,
} from "@/lib/types";

const EXPORT_STATUS_LABEL: Record<AdminFormExport["status"], string> = {
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
};

function formatAnswer(value: string | string[] | null): string {
  if (value === null) return "—";
  return Array.isArray(value) ? value.join(", ") : value;
}

export default function FormResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [form, setForm] = useState<AdminForm | null>(null);
  const [submissions, setSubmissions] = useState<AdminFormSubmission[] | null>(null);
  const [summary, setSummary] = useState<FormResponseSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [exports, setExports] = useState<AdminFormExport[]>([]);
  const [exportFormat, setExportFormat] = useState<FormExportFormat>("csv");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [formData, submissionsResult, exportList] = await Promise.all([
        apiGet<AdminForm>(`/admin/forms/${id}`),
        apiGetWithMeta<AdminFormSubmission[], { summary: FormResponseSummary }>(
          `/admin/forms/${id}/submissions`
        ),
        apiGet<AdminFormExport[]>(`/admin/forms/${id}/export`),
      ]);
      setForm(formData);
      setSubmissions(submissionsResult.data);
      setSummary(submissionsResult.meta?.summary ?? null);
      setExports(exportList);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat data respon.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const result = await apiPost<AdminFormExport>(`/admin/forms/${id}/export?format=${exportFormat}`);
      setExports((prev) => [result, ...prev]);
      toast.success(
        result.status === "completed" ? "Ekspor siap diunduh" : "Ekspor sedang diproses di latar belakang"
      );
    } catch (err) {
      setExportError(err instanceof ApiRequestError ? err.message : "Gagal membuat ekspor.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDownload(exportItem: AdminFormExport) {
    setDownloadingId(exportItem.id);
    try {
      await apiDownload(
        `/admin/forms/${id}/export/${exportItem.id}/download`,
        `form-${id}.${exportItem.format}`
      );
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Gagal mengunduh berkas.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/form"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Form & Survei
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground">
              {form ? `Respon — ${form.title}` : "Respon"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan, daftar respon, dan ekspor data untuk form ini.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => load()}
          >
            <RefreshCw className="size-4" />
            Segarkan
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {submissions === null && !loadError ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : summary ? (
        <>
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-white p-5 shadow-soft">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-text">
              <Users className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{summary.respondent_count}</p>
              <p className="text-sm text-muted-foreground">Total responden</p>
            </div>
          </div>

          {summary.distribution.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {summary.distribution.map((item) => (
                <ResponseDistributionChart key={item.field_id} distribution={item} />
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-3xl border border-border bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-base font-bold text-foreground">Ekspor Data</h2>
              <div className="flex items-center gap-2">
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as FormExportFormat)}>
                  <SelectTrigger className="h-10 w-28 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">XLSX</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={exporting}
                  onClick={handleExport}
                  className="h-10 gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
                >
                  {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Ekspor
                </Button>
              </div>
            </div>

            {exportError && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription>{exportError}</AlertDescription>
              </Alert>
            )}

            {exports.length > 0 && (
              <ul className="divide-y divide-border">
                {exports.map((exportItem) => (
                  <li
                    key={exportItem.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="uppercase">
                        {exportItem.format}
                      </Badge>
                      <Badge variant={exportItem.status === "completed" ? "default" : "secondary"}>
                        {EXPORT_STATUS_LABEL[exportItem.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(exportItem.created_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                    {exportItem.status === "completed" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={downloadingId === exportItem.id}
                        onClick={() => handleDownload(exportItem)}
                      >
                        {downloadingId === exportItem.id && (
                          <Loader2 className="size-3.5 animate-spin" />
                        )}
                        Unduh
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {exportItem.status === "processing"
                          ? "Klik Segarkan untuk memeriksa status"
                          : "Coba ekspor ulang"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu Kirim</TableHead>
                  <TableHead>Responden</TableHead>
                  <TableHead>Jawaban</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(submissions ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      Belum ada respon.
                    </TableCell>
                  </TableRow>
                ) : (
                  (submissions ?? []).map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(submission.submitted_at).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.respondent?.name ?? (
                          <span className="text-muted-foreground">Anonim/Tamu</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md text-sm">
                        <div className="space-y-1">
                          {submission.answers.map((answer) => (
                            <p key={answer.field_id} className="truncate">
                              <span className="font-medium text-foreground">{answer.label}:</span>{" "}
                              <span className="text-muted-foreground">
                                {formatAnswer(answer.value)}
                              </span>
                            </p>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : null}
    </div>
  );
}
