<?php

namespace App\Services;

use App\Models\Form;
use App\Models\FormAnswer;
use App\Models\FormExport;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

/**
 * Menulis respon form/survei ke berkas CSV atau XLSX — PRD §9 F-07.
 * BOM UTF-8 pada CSV supaya nama & tanda baca Indonesia tidak rusak saat
 * dibuka di Excel. Kolom identitas responden hanya disertakan bila survei
 * tidak anonim (submission.user_id memang sudah null untuk form anonim
 * sejak disimpan — lihat FormController::submit — jadi tidak perlu
 * pengecekan tambahan di sini selain menyembunyikan kolomnya).
 */
class FormExportService
{
    public function generate(FormExport $export): void
    {
        $export->load(['form.fields', 'form.submissions.user', 'form.submissions.answers']);
        $form = $export->form;

        $headers = $this->buildHeaders($form);
        $rows = $this->buildRows($form);

        $directory = 'exports';
        Storage::disk('local')->makeDirectory($directory);
        $relativePath = "{$directory}/form-{$form->id}-export-{$export->id}.{$export->format}";
        $fullPath = Storage::disk('local')->path($relativePath);

        if ($export->format === 'xlsx') {
            $this->writeXlsx($fullPath, $headers, $rows);
        } else {
            $this->writeCsv($fullPath, $headers, $rows);
        }

        $export->update([
            'status' => 'completed',
            'file_path' => $relativePath,
            'expires_at' => now()->addDay(),
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function buildHeaders(Form $form): array
    {
        $headers = ['Waktu Kirim'];

        if (! $form->is_anonymous) {
            $headers[] = 'Responden';
        }

        foreach ($form->fields as $field) {
            $headers[] = $field->label;
        }

        return $headers;
    }

    /**
     * @return array<int, array<int, string>>
     */
    private function buildRows(Form $form): array
    {
        return $form->submissions->map(function ($submission) use ($form) {
            $answersByField = $submission->answers->keyBy('field_id');

            $row = [$submission->submitted_at->format('Y-m-d H:i:s')];

            if (! $form->is_anonymous) {
                $row[] = $submission->user ? "{$submission->user->id} - {$submission->user->name}" : '(Tamu)';
            }

            foreach ($form->fields as $field) {
                $row[] = $this->formatValue($answersByField->get($field->id));
            }

            return $row;
        })->all();
    }

    private function formatValue(?FormAnswer $answer): string
    {
        if (! $answer) {
            return '';
        }

        if ($answer->value_json !== null) {
            return implode('; ', array_map('strval', $answer->value_json));
        }

        return (string) ($answer->value ?? '');
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, string>>  $rows
     */
    private function writeCsv(string $path, array $headers, array $rows): void
    {
        $handle = fopen($path, 'w');
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, string>>  $rows
     */
    private function writeXlsx(string $path, array $headers, array $rows): void
    {
        $writer = new XlsxWriter;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues($headers));
        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();
    }
}
