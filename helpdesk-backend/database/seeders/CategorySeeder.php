<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Hardware',       'description' => 'Physical device issues'],
            ['name' => 'Software',       'description' => 'Application and OS issues'],
            ['name' => 'Network',        'description' => 'Connectivity and network issues'],
            ['name' => 'Access',         'description' => 'Login and permissions'],
            ['name' => 'Email',          'description' => 'Email and communication'],
            ['name' => 'Other',          'description' => 'General requests'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }
    }
}
