/**
 * Pembuatan berkas .ics minimal (RFC 5545) untuk satu acara sepanjang hari.
 *
 * Ditulis tangan alih-alih memakai pustaka: kebutuhannya cuma satu acara tanpa
 * zona waktu, dan menambah dependensi untuk selusin baris teks tidak sepadan.
 */

/** Ubah `YYYY-MM-DD` menjadi `YYYYMMDD` — bentuk DATE pada iCalendar. */
function toIcsDate(isoDate: string): string {
  return isoDate.slice(0, 10).replace(/-/g, "");
}

/**
 * Baris iCalendar tidak boleh melebihi 75 oktet; sisanya dilipat dengan
 * diawali satu spasi. Judul/keterangan berbahasa Indonesia mudah melewatinya.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);

  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);

  return chunks.join("\r\n");
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildAllDayEventIcs({
  date,
  title,
  description,
  uid,
}: {
  /** Tanggal acara, `YYYY-MM-DD`. */
  date: string;
  title: string;
  description?: string;
  uid: string;
}): string {
  const start = toIcsDate(date);

  // DTEND bersifat eksklusif untuk acara sepanjang hari — harus hari berikutnya,
  // kalau tidak sebagian klien kalender merendernya sebagai acara nol-hari.
  const endDate = new Date(`${date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = toIcsDate(
    `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(
      endDate.getDate()
    ).padStart(2, "0")}`
  );

  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PrenaTalks//Kalkulator Kehamilan//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    foldLine(`SUMMARY:${escapeText(title)}`),
    ...(description ? [foldLine(`DESCRIPTION:${escapeText(description)}`)] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
