"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { TablePagination } from "@/components/admin/table-pagination";
import { UserRoleDialog } from "@/components/admin/user-role-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ROLE_LABELS } from "@/lib/validations/user";
import type { AdminUser, PaginationMeta } from "@/lib/types";

type SortKey = "name" | "email" | "role" | "created_at" | "last_login_at";

const SORTABLE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nama" },
  { key: "email", label: "Email" },
  { key: "role", label: "Peran" },
  { key: "last_login_at", label: "Login Terakhir" },
  { key: "created_at", label: "Terdaftar" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Kelola pengguna & role — PRD §8 (`/admin/pengguna`), §9 F-14.
 *
 * Pencarian, filter, sorting, dan paginasi semuanya **server-side**: daftar
 * pengguna adalah satu-satunya tabel admin yang pasti tumbuh sampai ribuan
 * baris (target 1.000 pengguna, PRD §3.2).
 */
export default function PenggunaAdminPage() {
  const { isSuperAdmin } = useSuperAdminGuard();

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<AdminUser | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ sort, direction, page: String(page) });
    if (search.trim()) params.set("search", search.trim());
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);
    return params.toString();
  }, [search, role, status, sort, direction, page]);

  const load = useCallback(async () => {
    setLoadError(null);
    setIsFetching(true);
    try {
      const result = await apiGetWithMeta<AdminUser[], PaginationMeta>(`/admin/users?${query}`);
      setUsers(result.data);
      setMeta(result.meta ?? null);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar pengguna.");
      setUsers([]);
    } finally {
      setIsFetching(false);
    }
  }, [query]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, isSuperAdmin]);

  // Debounce pencarian supaya tiap ketikan tidak jadi satu request ke server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!isSuperAdmin) {
    return (
      <SuperAdminRestricted description="Kelola pengguna dan peran hanya bisa diakses oleh Super Admin. Hubungi Super Admin bila Anda perlu mengubah peran seseorang." />
    );
  }

  function toggleSort(key: SortKey) {
    if (sort === key) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDirection("asc");
    }
    setPage(1);
  }

  function handleSaved(updated: AdminUser) {
    toast.success("Peran pengguna diperbarui");
    setEditing(null);
    setUsers((prev) => (prev ?? []).map((u) => (u.id === updated.id ? updated : u)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Pengguna</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Kelola peran dan status akun. Nama, email, dan kata sandi tetap milik pemilik akun —
          panel ini tidak bisa mengubahnya.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama atau email..."
            aria-label="Cari pengguna"
            className="h-11 rounded-full pl-10"
          />
        </div>

        <Select
          value={role}
          onValueChange={(value) => {
            setRole(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-44 rounded-xl" aria-label="Filter peran">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua peran</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-11 w-40 rounded-xl" aria-label="Filter status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {users === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Tidak ada pengguna yang cocok dengan pencarian atau filter Anda.
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-white p-2 shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                {SORTABLE_COLUMNS.map(({ key, label }) => (
                  <TableHead key={key}>
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className="inline-flex items-center gap-1 font-semibold hover:text-foreground"
                      aria-label={`Urutkan berdasarkan ${label}`}
                    >
                      {label}
                      {sort === key &&
                        (direction === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        ))}
                    </button>
                  </TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold text-foreground">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.last_login_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "outline"}>
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(user)}>
                      Ubah peran
                    </Button>
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

      <UserRoleDialog
        user={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
