"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiPut, ApiRequestError } from "@/lib/api-client";
import { ROLE_HINTS, ROLE_LABELS } from "@/lib/validations/user";
import type { AdminUser, UserRole } from "@/lib/types";

/**
 * Ubah peran & status akun — PRD §9 F-14.
 *
 * Isi dialog hanya di-mount saat terbuka dan di-key oleh id pengguna (pola
 * yang sama dengan dialog admin lain), jadi nilai awalnya selalu benar tanpa
 * effect pereset.
 */
export function UserRoleDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: AdminUser) => void;
}) {
  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Peran Pengguna</DialogTitle>
          <DialogDescription>
            {user ? `${user.name} · ${user.email}` : ""}
          </DialogDescription>
        </DialogHeader>
        {user && (
          <UserRoleForm
            key={user.id}
            user={user}
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function UserRoleForm({
  user,
  onCancel,
  onSaved,
}: {
  user: AdminUser;
  onCancel: () => void;
  onSaved: (updated: AdminUser) => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = role !== user.role || isActive !== user.is_active;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    setIsSaving(true);
    try {
      const updated = await apiPut<AdminUser>(`/admin/users/${user.id}`, {
        role,
        is_active: isActive,
      });
      onSaved(updated);
    } catch (err) {
      // Backend menolak penurunan peran diri sendiri dan super admin aktif
      // terakhir — pesannya sudah spesifik, jadi ditampilkan apa adanya.
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan perubahan, coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <FormField label="Peran" htmlFor="role" hint={ROLE_HINTS[role]}>
        <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
          <SelectTrigger id="role" className="h-11 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <label className="flex items-start gap-2.5 text-sm text-foreground">
        <Checkbox
          className="mt-0.5"
          checked={isActive}
          onCheckedChange={(next) => setIsActive(next === true)}
        />
        <span>
          Akun aktif
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Menonaktifkan akun mencegah pengguna masuk, tanpa menghapus datanya.
          </span>
        </span>
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}
