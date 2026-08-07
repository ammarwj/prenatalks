<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Hasil Cek Risiko Kehamilan</title>
    <style>
        @page { margin: 28px 36px; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12px; color: #1F2937; }
        h1 { font-size: 18px; margin: 0 0 4px; color: #0D9488; }
        .subtitle { color: #6B7280; margin: 0 0 16px; }
        .disclaimer {
            background: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 6px;
            padding: 10px 12px; font-size: 10.5px; color: #374151; margin-bottom: 16px;
        }
        .badge {
            display: inline-block; padding: 6px 14px; border-radius: 999px;
            color: #ffffff; font-weight: bold; font-size: 14px;
            background-color: {{ $riskLevel->color_hex ?? '#6B7280' }};
        }
        .meta { margin: 12px 0; color: #4B5563; }
        .score { font-size: 24px; font-weight: bold; margin: 4px 0; }
        .danger-alert {
            background: #FEF2F2; border: 1px solid #E11D48; color: #9F1239;
            border-radius: 6px; padding: 10px 12px; margin: 16px 0; font-size: 11px;
        }
        .danger-alert strong { color: #E11D48; }
        h2 { font-size: 13px; margin: 20px 0 8px; color: #111827; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; }
        td, th { text-align: left; padding: 6px 4px; font-size: 11px; border-bottom: 1px solid #F3F4F6; }
        .recommendation {
            background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 6px;
            padding: 10px 12px; font-size: 11.5px; margin-top: 8px;
        }
        .footer { margin-top: 24px; font-size: 9.5px; color: #9CA3AF; }
    </style>
</head>
<body>
    <h1>Hasil Cek Risiko Kehamilan</h1>
    <p class="subtitle">{{ $userName }} &middot; {{ $completedAt }}</p>

    <div class="disclaimer">
        {{ $disclaimer }}
    </div>

    @if($assessment->has_danger_sign)
        <div class="danger-alert">
            <strong>Tanda bahaya terdeteksi.</strong> Segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat.
        </div>
    @endif

    <div class="meta">
        <span class="badge">{{ $riskLevel->name ?? 'Belum diklasifikasikan' }}</span>
        <div class="score">Skor: {{ $assessment->total_score }}</div>
    </div>

    <h2>Rekomendasi</h2>
    <div class="recommendation">{{ $riskLevel->recommendation ?? '-' }}</div>

    <h2>Faktor Penyumbang Skor</h2>
    @if(count($contributingFactors))
        <table>
            <thead>
                <tr>
                    <th>Pertanyaan</th>
                    <th>Jawaban</th>
                    <th>Skor</th>
                </tr>
            </thead>
            <tbody>
                @foreach($contributingFactors as $factor)
                    <tr>
                        <td>{{ $factor['question_text'] }}</td>
                        <td>{{ $factor['answer_label'] }}</td>
                        <td>{{ $factor['score'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p>Tidak ada faktor penyumbang skor tambahan selain skor dasar.</p>
    @endif

    <div class="disclaimer">
        {{ $disclaimer }}
    </div>

    <p class="footer">Dihasilkan oleh PrenaTalks pada {{ $generatedAt }}. Dokumen ini bersifat informatif, bukan dokumen medis resmi.</p>
</body>
</html>
