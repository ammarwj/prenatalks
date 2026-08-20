import DOMPurify from "isomorphic-dompurify";

/**
 * Isi artikel dan dokumen legal disimpan sebagai HTML mentah dari TipTap.
 * Disanitasi ulang di titik render (bukan cuma dipercaya karena penulisnya
 * admin) sebagai pertahanan berlapis terhadap XSS — mis. akun admin yang
 * disusupi atau tempel-salin konten berbahaya ke editor.
 *
 * Allowlist di bawah sengaja sempit. Yang perlu diketahui saat menulis isi:
 * `h1`, `table`, `hr`, `img`, dan atribut `id` ikut dibuang — jadi daftar isi
 * dengan tautan lompat (`#pasal-3`) tidak akan berfungsi di halaman legal.
 */
export function sanitizeRichTextHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "rel", "target"],
  });
}
