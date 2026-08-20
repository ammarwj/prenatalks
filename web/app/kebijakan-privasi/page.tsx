import { LegalDocumentPage } from "@/components/public/legal-document-page";

const TITLE = "Kebijakan Privasi";

export const metadata = {
  title: `${TITLE} — PrenaTalks`,
  description:
    "Data apa yang PrenaTalks kumpulkan, untuk apa dipakai, dan hak Anda atasnya — mengacu UU Pelindungan Data Pribadi No. 27 Tahun 2022.",
};

export default function KebijakanPrivasiPage() {
  return <LegalDocumentPage slug="kebijakan-privasi" fallbackTitle={TITLE} />;
}
