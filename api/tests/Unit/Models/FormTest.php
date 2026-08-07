<?php

namespace Tests\Unit\Models;

use App\Models\Form;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FormTest extends TestCase
{
    public function test_draft_form_is_never_open(): void
    {
        $form = new Form(['status' => 'draft']);

        $this->assertFalse($form->isOpenForSubmission());
    }

    public function test_closed_form_is_never_open(): void
    {
        $form = new Form(['status' => 'closed']);

        $this->assertFalse($form->isOpenForSubmission());
    }

    public function test_published_form_without_period_is_open(): void
    {
        $form = new Form(['status' => 'published']);

        $this->assertTrue($form->isOpenForSubmission());
    }

    public function test_published_form_before_opens_at_is_not_open(): void
    {
        $form = new Form(['status' => 'published', 'opens_at' => Carbon::now()->addDay()]);

        $this->assertFalse($form->isOpenForSubmission());
    }

    public function test_published_form_after_closes_at_is_not_open(): void
    {
        $form = new Form(['status' => 'published', 'closes_at' => Carbon::now()->subDay()]);

        $this->assertFalse($form->isOpenForSubmission());
    }

    public function test_published_form_within_period_is_open(): void
    {
        $form = new Form([
            'status' => 'published',
            'opens_at' => Carbon::now()->subDay(),
            'closes_at' => Carbon::now()->addDay(),
        ]);

        $this->assertTrue($form->isOpenForSubmission());
    }
}
