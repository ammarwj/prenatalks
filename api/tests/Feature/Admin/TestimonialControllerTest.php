<?php

namespace Tests\Feature\Admin;

use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class TestimonialControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siti',
            'pregnancy_age' => '28 minggu',
            'quote' => 'Informasinya lengkap dan mudah dipahami.',
            'rating' => 5,
            'is_published' => true,
        ], $overrides);
    }

    public function test_guest_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/testimonials')->assertStatus(401);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/testimonials')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_testimonial(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/testimonials', $this->payload())
            ->assertCreated()
            ->assertJson([
                'data' => [
                    'name' => 'Siti',
                    'pregnancy_age' => '28 minggu',
                    'rating' => 5,
                    'is_published' => true,
                    'order_index' => 10,
                ],
            ]);
    }

    public function test_super_admin_can_create_a_testimonial(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/testimonials', $this->payload())
            ->assertCreated();
    }

    public function test_new_testimonials_are_appended_to_the_end_of_the_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->postJson('/api/v1/admin/testimonials', $this->payload());
        $second = $this->withHeaders($headers)
            ->postJson('/api/v1/admin/testimonials', $this->payload(['name' => 'Rina']));

        $this->assertSame(20, $second->json('data.order_index'));
    }

    public function test_name_pregnancy_age_and_quote_are_required(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/testimonials', ['name' => '', 'pregnancy_age' => '', 'quote' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'pregnancy_age', 'quote']);
    }

    /**
     * Kartu testimoni hanya punya ruang lima bintang — nilai di luar itu akan
     * merender baris bintang yang meluber atau kosong.
     */
    public function test_rating_outside_one_to_five_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)
            ->postJson('/api/v1/admin/testimonials', $this->payload(['rating' => 0]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('rating');

        $this->withHeaders($headers)
            ->postJson('/api/v1/admin/testimonials', $this->payload(['rating' => 6]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('rating');
    }

    public function test_photo_is_stored_as_webp(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->post(
            '/api/v1/admin/testimonials',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 600, 600)],
            ['Accept' => 'application/json']
        );

        $response->assertCreated();
        $photoUrl = $response->json('data.photo_url');
        $this->assertNotNull($photoUrl);
        $this->assertStringEndsWith('.webp', $photoUrl);
        $this->assertStringContainsString('testimonials/', $photoUrl);
    }

    public function test_non_image_upload_is_rejected(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))->post(
            '/api/v1/admin/testimonials',
            [...$this->payload(), 'photo' => UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf')],
            ['Accept' => 'application/json']
        )->assertStatus(422)->assertJsonValidationErrors('photo');
    }

    public function test_update_can_remove_the_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->post(
            '/api/v1/admin/testimonials',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 400, 400)],
            ['Accept' => 'application/json']
        );
        $id = $created->json('data.id');
        $storedPath = Testimonial::find($id)->photo_path;

        $response = $this->withHeaders($headers)->post(
            "/api/v1/admin/testimonials/{$id}",
            [...$this->payload(), '_method' => 'PUT', 'remove_photo' => '1'],
            ['Accept' => 'application/json']
        );

        $response->assertOk();
        $this->assertNull($response->json('data.photo_url'));
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_admin_can_unpublish_a_testimonial(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/admin/testimonials', $this->payload());

        $this->withHeaders($headers)
            ->putJson(
                "/api/v1/admin/testimonials/{$created->json('data.id')}",
                $this->payload(['is_published' => false])
            )
            ->assertOk()
            ->assertJson(['data' => ['is_published' => false]]);

        $this->getJson('/api/v1/testimonials')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_deleting_a_testimonial_also_deletes_the_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->post(
            '/api/v1/admin/testimonials',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 400, 400)],
            ['Accept' => 'application/json']
        );
        $id = $created->json('data.id');
        $storedPath = Testimonial::find($id)->photo_path;

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/testimonials/{$id}")->assertOk();

        $this->assertDatabaseMissing('testimonials', ['id' => $id]);
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_reorder_persists_the_new_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $first = Testimonial::create($this->payload(['name' => 'Pertama', 'order_index' => 10]));
        $second = Testimonial::create($this->payload(['name' => 'Kedua', 'order_index' => 20]));

        $response = $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/testimonials/reorder', ['ids' => [$second->id, $first->id]]);

        $response->assertOk();
        $this->assertSame('Kedua', $response->json('data.0.name'));
        $this->assertSame(10, $response->json('data.0.order_index'));
    }

    public function test_reorder_rejects_unknown_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/testimonials/reorder', ['ids' => [999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids.0');
    }
}
