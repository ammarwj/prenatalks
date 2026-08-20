import { LegalDocumentPage } from "@/components/public/legal-document-page";

const TITLE = "Syarat & Ketentuan";

export const metadata = {
  title: `${TITLE} — PrenaTalks`,
  description:
    "Ketentuan penggunaan layanan PrenaTalks, termasuk sifat layanan yang bersifat edukatif dan bukan pengganti nasihat tenaga kesehatan.",
};

export default function SyaratKetentuanPage() {
  return <LegalDocumentPage slug="syarat-ketentuan" fallbackTitle={TITLE} />;
}
