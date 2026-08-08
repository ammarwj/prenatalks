import DOMPurify from "isomorphic-dompurify";

/**
 * Isi artikel disimpan sebagai HTML mentah dari TipTap. Disanitasi ulang di
 * titik render (bukan cuma dipercaya karena penulisnya admin) sebagai
 * pertahanan berlapis terhadap XSS — mis. akun admin yang disusupi atau
 * tempel-salin konten berbahaya ke editor.
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "h4", "blockquote", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "rel", "target"],
  });
}
