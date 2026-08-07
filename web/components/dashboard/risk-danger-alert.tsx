import { TriangleAlert } from "lucide-react";

/**
 * Alert merah persisten untuk tanda bahaya — tampil terlepas dari total skor
 * (PRD §9 F-05 "Deteksi tanda bahaya"). Dipakai baik di wizard (begitu opsi
 * `is_danger_sign` dipilih) maupun di halaman hasil.
 */
export function RiskDangerAlert() {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-feature-danger-soft px-4 py-3.5 text-danger"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-0.5">
        <p className="text-sm font-bold">Tanda bahaya terdeteksi</p>
        <p className="text-sm">
          Segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat — jangan menunggu
          hasil akhir cek risiko ini.
        </p>
      </div>
    </div>
  );
}
