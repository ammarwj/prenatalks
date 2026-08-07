<?php

namespace Tests\Unit\Services;

use App\Models\FormField;
use App\Services\FormFieldRuleBuilder;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class FormFieldRuleBuilderTest extends TestCase
{
    private function field(array $attributes): FormField
    {
        $id = $attributes['id'] ?? 1;
        unset($attributes['id']);

        $field = new FormField(array_merge([
            'label' => 'Field Uji',
            'is_required' => false,
        ], $attributes));
        $field->id = $id;

        return $field;
    }

    public function test_required_field_rejects_missing_value(): void
    {
        $field = $this->field(['type' => 'text', 'is_required' => true]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make([], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 'Ada isi'], ['answer' => $rules])->passes());
    }

    public function test_optional_field_allows_missing_value(): void
    {
        $field = $this->field(['type' => 'text', 'is_required' => false]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make([], ['answer' => $rules])->passes());
    }

    public function test_text_field_enforces_min_max_length(): void
    {
        $field = $this->field(['type' => 'text', 'is_required' => true, 'validation' => ['min' => 3, 'max' => 5]]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make(['answer' => 'ab'], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 'abcdef'], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 'abcd'], ['answer' => $rules])->passes());
    }

    public function test_text_field_enforces_regex(): void
    {
        $field = $this->field(['type' => 'text', 'is_required' => true, 'validation' => ['regex' => '^\d{5}$']]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make(['answer' => 'abcde'], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => '12345'], ['answer' => $rules])->passes());
    }

    public function test_number_field_enforces_range(): void
    {
        $field = $this->field(['type' => 'number', 'is_required' => true, 'validation' => ['min' => 1, 'max' => 10]]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make(['answer' => 0], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 11], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 5], ['answer' => $rules])->passes());
    }

    public function test_radio_field_only_accepts_listed_options(): void
    {
        $field = $this->field(['type' => 'radio', 'is_required' => true, 'options' => ['Ya', 'Tidak']]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make(['answer' => 'Mungkin'], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 'Ya'], ['answer' => $rules])->passes());
    }

    public function test_scale_field_enforces_option_bounds(): void
    {
        $field = $this->field(['type' => 'scale', 'is_required' => true, 'options' => ['min' => 1, 'max' => 5]]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertTrue(Validator::make(['answer' => 0], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 6], ['answer' => $rules])->fails());
        $this->assertTrue(Validator::make(['answer' => 3], ['answer' => $rules])->passes());
    }

    public function test_file_field_caps_size_at_2048kb_even_if_configured_higher(): void
    {
        $field = $this->field(['type' => 'file', 'validation' => ['max_size_kb' => 5000]]);
        $rules = FormFieldRuleBuilder::build($field);

        $this->assertContains('max:2048', $rules);
    }

    public function test_checkbox_field_builds_array_rule_with_per_item_options(): void
    {
        $field = $this->field(['id' => 7, 'type' => 'checkbox', 'options' => ['Merah', 'Biru']]);
        $rules = FormFieldRuleBuilder::buildForFields([$field]);

        $this->assertSame(['nullable', 'array'], $rules['field_7']);
        $this->assertSame(['in:Merah,Biru'], $rules['field_7.*']);
    }
}
