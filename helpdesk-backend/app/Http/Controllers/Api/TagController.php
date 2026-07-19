<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => Tag::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', User::class);
        $data = $request->validate([
            'name'  => 'required|string|max:50|unique:tags,name',
            'color' => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
        ]);
        return response()->json(['success' => true, 'data' => Tag::create($data)], 201);
    }

    public function update(Request $request, Tag $tag)
    {
        $this->authorize('manage', User::class);
        $data = $request->validate([
            'name'  => 'sometimes|string|max:50|unique:tags,name,' . $tag->id,
            'color' => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
        ]);
        $tag->update($data);
        return response()->json(['success' => true, 'data' => $tag]);
    }

    public function destroy(Tag $tag)
    {
        $this->authorize('manage', User::class);
        $tag->delete();
        return response()->json(['success' => true]);
    }

    // Sync tags on a ticket
    public function syncTicketTags(Request $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);
        $data = $request->validate(['tag_ids' => 'present|array', 'tag_ids.*' => 'integer|exists:tags,id']);
        $ticket->tags()->sync($data['tag_ids']);
        return response()->json(['success' => true, 'data' => $ticket->tags]);
    }
}
