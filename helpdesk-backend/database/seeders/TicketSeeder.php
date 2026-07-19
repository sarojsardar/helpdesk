<?php

namespace Database\Seeders;

use App\Models\Ticket;
use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $user    = User::where('role', 'user')->first();
        $staff   = User::where('role', 'staff')->first();
        $admin   = User::where('role', 'admin')->first();
        $cats    = Category::pluck('id', 'name');

        $tickets = [
            // open
            [
                'title'             => 'Cannot connect to VPN',
                'description'       => 'Getting timeout error when trying to connect to company VPN from home.',
                'priority'          => 'high',
                'status'            => 'open',
                'category_id'       => $cats['Network'] ?? null,
                'assigned_to'       => null,
                'response_due_at'   => now()->addHours(4),
                'resolution_due_at' => now()->addHours(8),
            ],
            [
                'title'             => 'Request new monitor',
                'description'       => 'My current monitor has dead pixels. Requesting a replacement.',
                'priority'          => 'low',
                'status'            => 'open',
                'category_id'       => $cats['Hardware'] ?? null,
                'assigned_to'       => null,
                'response_due_at'   => now()->addHours(24),
                'resolution_due_at' => now()->addDays(3),
            ],
            [
                'title'             => 'Outlook keeps crashing',
                'description'       => 'Outlook crashes every time I try to open an attachment.',
                'priority'          => 'medium',
                'status'            => 'open',
                'category_id'       => $cats['Email'] ?? null,
                'assigned_to'       => null,
                'response_due_at'   => now()->addHours(8),
                'resolution_due_at' => now()->addHours(24),
            ],

            // in_progress
            [
                'title'             => 'Cannot access shared drive',
                'description'       => 'Permission denied when accessing the marketing shared drive.',
                'priority'          => 'high',
                'status'            => 'in_progress',
                'category_id'       => $cats['Access'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subHours(1),
                'resolution_due_at' => now()->addHours(6),
                'first_response_at' => now()->subHours(1),
            ],
            [
                'title'             => 'Laptop running very slow',
                'description'       => 'Machine takes 10+ minutes to boot and apps freeze frequently.',
                'priority'          => 'medium',
                'status'            => 'in_progress',
                'category_id'       => $cats['Hardware'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subHours(2),
                'resolution_due_at' => now()->addHours(4),
                'first_response_at' => now()->subHours(2),
            ],
            [
                'title'             => 'Software license expired',
                'description'       => 'Adobe Acrobat license expired, cannot open PDFs.',
                'priority'          => 'critical',
                'status'            => 'in_progress',
                'category_id'       => $cats['Software'] ?? null,
                'assigned_to'       => $admin->id,
                'response_due_at'   => now()->subHours(3),
                'resolution_due_at' => now()->addHours(2),
                'first_response_at' => now()->subHours(3),
            ],

            // resolved
            [
                'title'             => 'Password reset request',
                'description'       => 'Locked out of account after too many failed attempts.',
                'priority'          => 'medium',
                'status'            => 'resolved',
                'category_id'       => $cats['Access'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subDays(2),
                'resolution_due_at' => now()->subDays(1),
                'first_response_at' => now()->subDays(2)->addHours(1),
                'resolved_at'       => now()->subDays(1),
            ],
            [
                'title'             => 'Printer not working',
                'description'       => 'Office printer on 3rd floor shows offline status.',
                'priority'          => 'low',
                'status'            => 'resolved',
                'category_id'       => $cats['Hardware'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subDays(3),
                'resolution_due_at' => now()->subDays(2),
                'first_response_at' => now()->subDays(3)->addHours(2),
                'resolved_at'       => now()->subDays(2)->addHours(3),
            ],
            [
                'title'             => 'Email not syncing on mobile',
                'description'       => 'Company email stopped syncing on iPhone after iOS update.',
                'priority'          => 'medium',
                'status'            => 'resolved',
                'category_id'       => $cats['Email'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subDays(4),
                'resolution_due_at' => now()->subDays(3),
                'first_response_at' => now()->subDays(4)->addHours(1),
                'resolved_at'       => now()->subDays(3)->addHours(5),
            ],

            // closed
            [
                'title'             => 'Setup new employee workstation',
                'description'       => 'New hire starting Monday needs workstation configured.',
                'priority'          => 'high',
                'status'            => 'closed',
                'category_id'       => $cats['Hardware'] ?? null,
                'assigned_to'       => $admin->id,
                'response_due_at'   => now()->subDays(7),
                'resolution_due_at' => now()->subDays(6),
                'first_response_at' => now()->subDays(7)->addHours(1),
                'resolved_at'       => now()->subDays(6),
            ],
            [
                'title'             => 'Install project management software',
                'description'       => 'Need Jira installed and configured on my workstation.',
                'priority'          => 'low',
                'status'            => 'closed',
                'category_id'       => $cats['Software'] ?? null,
                'assigned_to'       => $staff->id,
                'response_due_at'   => now()->subDays(10),
                'resolution_due_at' => now()->subDays(9),
                'first_response_at' => now()->subDays(10)->addHours(3),
                'resolved_at'       => now()->subDays(9)->addHours(2),
            ],
            [
                'title'             => 'Network port not working at desk',
                'description'       => 'Ethernet port at desk 4B has no connectivity.',
                'priority'          => 'critical',
                'status'            => 'closed',
                'category_id'       => $cats['Network'] ?? null,
                'assigned_to'       => $admin->id,
                'response_due_at'   => now()->subDays(5),
                'resolution_due_at' => now()->subDays(4),
                'first_response_at' => now()->subDays(5)->addMinutes(30),
                'resolved_at'       => now()->subDays(4)->addHours(1),
            ],
        ];

        foreach ($tickets as $data) {
            Ticket::create(array_merge($data, ['user_id' => $user->id]));
        }
    }
}
