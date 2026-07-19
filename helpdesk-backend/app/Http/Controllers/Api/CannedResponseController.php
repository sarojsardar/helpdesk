<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CannedResponse;
use Illuminate\Http\Request;

class CannedResponseController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => CannedResponse::latest()->get(['id', 'title', 'body']),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $canned = CannedResponse::create(array_merge($data, ['created_by' => $request->user()->id]));

        return response()->json(['success' => true, 'data' => $canned], 201);
    }

    public function update(Request $request, CannedResponse $cannedResponse)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string',
        ]);

        $cannedResponse->update($data);

        return response()->json(['success' => true, 'data' => $cannedResponse]);
    }

    public function destroy(CannedResponse $cannedResponse)
    {
        $this->authorize('manage', \App\Models\User::class);
        $cannedResponse->delete();

        return response()->json(['success' => true]);
    }
}
