import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * FAQ khusus kalkulator.
 *
 * Sengaja hardcoded, bukan lewat FaqAccordion + CMS: pertanyaan-pertanyaan ini
 * menjelaskan cara kerja satu halaman ini dan tidak perlu masuk daftar FAQ
 * global. Isi yang sama juga memberi makan JSON-LD FAQPage di page.tsx, jadi
 * keduanya tidak bisa berbeda.
 */
export const CALCULATOR_FAQS = [
  {
    question: "Apa itu HPHT dan kenapa dipakai untuk menghitung usia kehamilan?",
    answer:
      "HPHT adalah Hari Pertama Haid Terakhir — hari pertama menstruasi terakhir Anda sebelum hamil. Usia kehamilan dihitung dari tanggal ini, bukan dari perkiraan hari pembuahan, karena HPHT jauh lebih mudah diingat dan dicatat. Konsekuensinya, pada dua minggu pertama usia kehamilan Anda secara teknis belum hamil.",
  },
  {
    question: "Bagaimana rumus Naegele menghitung HPL?",
    answer:
      "Rumus Naegele mengambil tanggal HPHT, menambah 7 hari, mengurangi 3 bulan, lalu menambah 1 tahun. Contoh: HPHT 15 Januari 2026 menghasilkan HPL 22 Oktober 2026. Rumus ini setara dengan 280 hari atau 40 minggu sejak HPHT.",
  },
  {
    question: "Seberapa akurat perkiraan hari lahir ini?",
    answer:
      "HPL adalah perkiraan, bukan jadwal. Hanya sekitar 1 dari 20 bayi lahir tepat pada HPL-nya; sebagian besar lahir dalam rentang dua minggu sebelum atau sesudahnya. Kelahiran pada usia 37 sampai 42 minggu masih tergolong normal.",
  },
  {
    question: "Bagaimana kalau siklus haid saya tidak teratur?",
    answer:
      "Rumus Naegele mengasumsikan siklus haid 28 hari. Bila siklus Anda lebih panjang, lebih pendek, atau tidak teratur, hasilnya bisa meleset beberapa hari sampai lebih dari seminggu. Pemeriksaan USG pada trimester pertama jauh lebih akurat untuk menentukan usia kehamilan. Bila bidan atau dokter sudah memberi HPL dari USG, Anda dapat mencatatnya di halaman Data Kehamilan setelah masuk, dan seluruh dashboard akan memakai tanggal itu.",
  },
  {
    question: "Bagaimana pembagian trimesternya?",
    answer:
      "Trimester pertama berlangsung dari minggu 0 sampai akhir minggu 13, trimester kedua dari minggu 14 sampai akhir minggu 27, dan trimester ketiga dari minggu 28 sampai kelahiran.",
  },
  {
    question: "Apakah data yang saya masukkan disimpan?",
    answer:
      "Tidak. Pada mode tamu, tanggal yang Anda masukkan hanya dipakai untuk menghitung dan tidak disimpan di akun mana pun. Bila Anda masuk, Anda bisa memilih untuk menyimpan HPHT ke profil kehamilan agar dashboard dan rekomendasi artikel menyesuaikan usia kehamilan Anda.",
  },
] as const;

export function CalculatorFaq() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-extrabold text-foreground">
        Pertanyaan Umum tentang Kalkulator
      </h2>

      <Accordion type="single" collapsible className="rounded-3xl border border-border bg-white px-5 shadow-soft">
        {CALCULATOR_FAQS.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger className="text-left text-sm font-semibold text-foreground">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
