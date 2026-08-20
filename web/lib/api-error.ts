export class ApiRequestError extends Error {
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /**
   * Pesan yang layak ditampilkan ke pengguna.
   *
   * Handler validasi di backend selalu mengisi `message` dengan teks generik
   * "Data yang diberikan tidak valid" dan menaruh alasan sebenarnya di
   * `errors` per field. Untuk form yang menandai kesalahan di sebelah
   * inputnya, itu sudah benar. Tapi untuk yang hanya punya satu toast —
   * unggahan berkas, misalnya — teks generik itu tidak memberi tahu apa pun,
   * padahal alasannya ("Favicon harus berbentuk persegi. Berkas Anda 620×588
   * piksel.") sudah ikut terkirim. Di sini alasan pertama itu yang dipakai.
   */
  detail(): string {
    return Object.values(this.fieldErrors ?? {}).flat()[0] ?? this.message;
  }
}
