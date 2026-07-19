<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name'       => 'Admin User',
            'email'      => 'admin@helpdesk.com',
            'password'   => 'password',
            'role'       => 'admin',
            'department' => 'IT',
        ]);

        User::create([
            'name'       => 'Staff Agent',
            'email'      => 'staff@helpdesk.com',
            'password'   => 'password',
            'role'       => 'staff',
            'department' => 'Support',
        ]);

        User::create([
            'name'     => 'Regular User',
            'email'    => 'user@helpdesk.com',
            'password' => 'password',
            'role'     => 'user',
        ]);
    }
}
