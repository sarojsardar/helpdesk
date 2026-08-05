<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class StaffStatusController extends Controller
{
    /**
     * Get current user's availability status.
     */
    public function show(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => ['availability_status' => $request->user()->availability_status ?? 'online'],
        ]);
    }

    /**
     * Update current user's availability status.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'availability_status' => 'required|in:online,busy,away',
        ]);

        $request->user()->update($data);

        return response()->json([
            'success' => true,
            'data'    => ['availability_status' => $data['availability_status']],
            'message' => 'Status updated',
        ]);
    }
}
