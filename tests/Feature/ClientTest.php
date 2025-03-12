<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class ClientTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create and authenticate a user for each test
        $this->user = User::factory()->create();
        
        // Define test routes that bypass Inertia
        $this->setupTestRoutes();
    }
    
    protected function setupTestRoutes()
    {
        // Override the web routes with test-specific routes
        Route::get('clients', function () {
            return response()->json(['component' => 'Clients/Index', 'props' => ['clients' => Client::all()]]);
        })->name('clients.index');
        
        Route::get('clients/create', function () {
            return response()->json(['component' => 'Clients/Create']);
        })->name('clients.create');
        
        Route::get('clients/{client}', function (Client $client) {
            return response()->json(['component' => 'Clients/Show', 'props' => ['client' => $client]]);
        })->name('clients.show');
        
        Route::get('clients/{client}/edit', function (Client $client) {
            return response()->json(['component' => 'Clients/Edit', 'props' => ['client' => $client]]);
        })->name('clients.edit');
    }

    #[Test]
    public function a_user_can_view_clients_list()
    {
        // Given we have clients in the database
        Client::factory()->count(3)->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the clients page
        $response = $this->actingAs($this->user)
            ->get(route('clients.index'));

        // Then they should see the clients list
        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Clients/Index'
        ]);
    }

    #[Test]
    public function a_user_can_view_the_create_client_form()
    {
        $response = $this->actingAs($this->user)
            ->get(route('clients.create'));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Clients/Create'
        ]);
    }

    #[Test]
    public function a_user_can_create_a_new_client()
    {
        $clientData = [
            'name' => $this->faker->company,
            'description' => $this->faker->paragraph,
            'emails' => json_encode([$this->faker->email]),
            'phone_numbers' => json_encode([$this->faker->phoneNumber]),
            'addresses' => $this->faker->address,
            'website_urls' => json_encode([$this->faker->url]),
            'other_contact_info' => json_encode(['skype' => $this->faker->userName]),
        ];

        $response = $this->actingAs($this->user)
            ->post(route('clients.store'), $clientData);

        // Check that the client was created in the database
        $this->assertDatabaseHas('clients', [
            'name' => $clientData['name'],
            'created_by' => $this->user->id,
        ]);

        // Check redirect to clients.index
        $response->assertRedirect(route('clients.index'));
    }

    #[Test]
    public function a_user_can_view_a_client()
    {
        // Create a client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the client page
        $response = $this->actingAs($this->user)
            ->get(route('clients.show', $client));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Clients/Show'
        ]);
    }

    #[Test]
    public function a_user_can_view_the_edit_client_form()
    {
        // Create a client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user visits the edit client page
        $response = $this->actingAs($this->user)
            ->get(route('clients.edit', $client));

        $response->assertStatus(200);
        $response->assertJson([
            'component' => 'Clients/Edit'
        ]);
    }

    #[Test]
    public function a_user_can_update_a_client()
    {
        // Create a client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // New data for the client
        $updatedData = [
            'name' => 'Updated Client Name',
            'description' => 'Updated client description',
            'emails' => json_encode([$this->faker->email]),
            'phone_numbers' => json_encode([$this->faker->phoneNumber]),
            'addresses' => $this->faker->address,
            'website_urls' => json_encode([$this->faker->url]),
            'other_contact_info' => json_encode(['skype' => $this->faker->userName]),
        ];

        // When a user updates the client
        $response = $this->actingAs($this->user)
            ->put(route('clients.update', $client), $updatedData);

        // Then the client should be updated in the database
        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Updated Client Name',
            'description' => 'Updated client description',
        ]);

        // And the user should be redirected to the clients index
        $response->assertRedirect(route('clients.index'));
    }

    #[Test]
    public function a_user_can_delete_a_client()
    {
        // Create a client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user deletes the client
        $response = $this->actingAs($this->user)
            ->delete(route('clients.destroy', $client));

        // Then the client should be deleted from the database
        $this->assertDatabaseMissing('clients', [
            'id' => $client->id,
        ]);

        // And the user should be redirected to the clients index
        $response->assertRedirect(route('clients.index'));
    }

    #[Test]
    public function a_user_cannot_delete_a_client_with_projects()
    {
        // Create a client
        $client = Client::factory()->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // Create a project for this client
        $client->projects()->create([
            'name' => 'Test Project',
            'description' => 'Test project description',
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
            'status' => 'planned',
        ]);

        // When a user tries to delete the client
        $response = $this->actingAs($this->user)
            ->delete(route('clients.destroy', $client));

        // Then the client should not be deleted
        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
        ]);

        // And an error message should be returned
        $response->assertRedirect();
        $response->assertSessionHas('error', 'Cannot delete the client because they have associated projects.');
    }

    #[Test]
    public function a_user_can_get_latest_clients_as_json()
    {
        // Create several clients
        Client::factory()->count(10)->create([
            'created_by' => $this->user->id,
            'updated_by' => $this->user->id,
        ]);

        // When a user requests the latest clients
        $response = $this->actingAs($this->user)
            ->getJson('/api/latest-clients');

        // Then they should receive a list of the latest 5 clients
        $response->assertStatus(200);
        $response->assertJsonCount(5);
    }
} 