<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    /**
     * Get active announcements for the current user's role.
     */
    public function active(Request $request)
    {
        $announcements = Announcement::activeFor($request->user()->role);

        return response()->json(['success' => true, 'data' => $announcements]);
    }

    /**
     * Admin: list all announcements.
     */
    public function index(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $announcements = Announcement::with('creator:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $announcements]);
    }

    /**
     * Create announcement.
     */
    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'title'        => 'required|string|max:200',
            'body'         => 'required|string|max:2000',
            'type'         => 'in:info,warning,success,danger',
            'target_roles' => 'nullable|array',
            'target_roles.*' => 'in:admin,staff,user',
            'is_active'    => 'boolean',
            'starts_at'    => 'nullable|date',
            'expires_at'   => 'nullable|date|after_or_equal:starts_at',
        ]);

        $data['created_by'] = $request->user()->id;
        $announcement = Announcement::create($data);

        return response()->json([
            'success' => true,
            'data'    => $announcement,
            'message' => 'Announcement created',
        ], 201);
    }

    /**
     * Update announcement.
     */
    public function update(Request $request, Announcement $announcement)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'title'        => 'required|string|max:200',
            'body'         => 'required|string|max:2000',
            'type'         => 'in:info,warning,success,danger',
            'target_roles' => 'nullable|array',
            'target_roles.*' => 'in:admin,staff,user',
            'is_active'    => 'boolean',
            'starts_at'    => 'nullable|date',
            'expires_at'   => 'nullable|date|after_or_equal:starts_at',
        ]);

        $announcement->update($data);

        return response()->json([
            'success' => true,
            'data'    => $announcement->fresh(),
            'message' => 'Announcement updated',
        ]);
    }

    /**
     * Delete announcement.
     */
    public function destroy(Announcement $announcement)
    {
        $this->authorize('manage', \App\Models\User::class);

        $announcement->delete();

        return response()->json(['success' => true, 'message' => 'Announcement deleted']);
    }
}
