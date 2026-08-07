<?php

namespace App\Services;

use App\Models\FormField;

/**
 * Membangun aturan validasi Laravel dinamis dari FormField::type,
 * FormField::validation (JSONB), dan FormField::is_required — dipakai saat
 * submission form/survei divalidasi (PRD §9 F-06, "Validasi dinamis
 * submission sesuai validation JSONB per field"). Kunci jawaban per field
 * memakai pola `field_{id}` supaya siap dipakai langsung sebagai input
 * `Validator::make()` oleh endpoint submit form/survei (F-07).
 */
class FormFieldRuleBuilder
{
    /**
     * @return array<int, string>
     */
    public static function build(FormField $field): array
    {
        $rules = [$field->is_required ? 'required' : 'nullable'];
        $validation = $field->validation ?? [];

        switch ($field->type) {
            case 'text':
                $rules[] = 'string';
                self::applyLength($rules, $validation);
                if (! empty($validation['regex'])) {
                    $rules[] = "regex:/{$validation['regex']}/u";
                }
                break;

            case 'textarea':
                $rules[] = 'string';
                self::applyLength($rules, $validation);
                break;

            case 'number':
                $rules[] = 'numeric';
                if (isset($validation['min'])) {
                    $rules[] = "min:{$validation['min']}";
                }
                if (isset($validation['max'])) {
                    $rules[] = "max:{$validation['max']}";
                }
                break;

            case 'date':
                $rules[] = 'date';
                break;

            case 'radio':
            case 'select':
                $rules[] = 'string';
                $options = $field->options ?? [];
                if (! empty($options)) {
                    $rules[] = 'in:'.implode(',', $options);
                }
                break;

            case 'checkbox':
                $rules[] = 'array';
                break;

            case 'scale':
                $rules[] = 'integer';
                $options = $field->options ?? [];
                if (isset($options['min'])) {
                    $rules[] = "min:{$options['min']}";
                }
                if (isset($options['max'])) {
                    $rules[] = "max:{$options['max']}";
                }
                break;

            case 'file':
                $rules[] = 'file';
                $rules[] = 'max:'.min($validation['max_size_kb'] ?? 2048, 2048);
                if (! empty($validation['allowed_extensions'])) {
                    $rules[] = 'mimes:'.implode(',', $validation['allowed_extensions']);
                }
                break;
        }

        return $rules;
    }

    /**
     * @param  iterable<FormField>  $fields
     * @return array<string, array<int, string>>
     */
    public static function buildForFields(iterable $fields): array
    {
        $rules = [];

        foreach ($fields as $field) {
            $rules["field_{$field->id}"] = self::build($field);

            if ($field->type === 'checkbox') {
                $options = $field->options ?? [];
                if (! empty($options)) {
                    $rules["field_{$field->id}.*"] = ['in:'.implode(',', $options)];
                }
            }
        }

        return $rules;
    }

    /**
     * @param  array<int, string>  $rules
     * @param  array<string, mixed>  $validation
     */
    private static function applyLength(array &$rules, array $validation): void
    {
        if (isset($validation['min'])) {
            $rules[] = "min:{$validation['min']}";
        }
        if (isset($validation['max'])) {
            $rules[] = "max:{$validation['max']}";
        }
    }
}
