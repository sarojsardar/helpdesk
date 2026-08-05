<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbCategory;
use Illuminate\Http\Request;

class KbCategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = KbCategory::with(['parent:id,name'])
            ->withCount(['articles' => fn($q) => $q->where('is_published', true)])
            ->when(!in_array($request->user()?->role, ['admin', 'staff']), fn($q) => $q->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'slug'        => 'nullable|string|max:120|unique:kb_categories,slug',
            'description' => 'nullable|string|max:500',
            'parent_id'   => 'nullable|exists:kb_categories,id',
            'sort_order'  => 'integer|min:0',
            'is_active'   => 'boolean',
        ]);

        $category = KbCategory::create($data);

        return response()->json(['success' => true, 'data' => $category, 'message' => 'KB category created'], 201);
    }

    public function update(Request $request, KbCategory $kbCategory)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'slug'        => 'nullable|string|max:120|unique:kb_categories,slug,' . $kbCategory->id,
            'description' => 'nullable|string|max:500',
            'parent_id'   => 'nullable|exists:kb_categories,id',
            'sort_order'  => 'integer|min:0',
            'is_active'   => 'boolean',
        ]);

        $kbCategory->update($data);

        return response()->json(['success' => true, 'data' => $kbCategory->fresh(), 'message' => 'KB category updated']);
    }

    public function destroy(KbCategory $kbCategory)
    {
        $this->authorize('manage', \App\Models\User::class);

        if ($kbCategory->articles()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete category with articles. Move or delete them first.'], 422);
        }

        $kbCategory->delete();

        return response()->json(['success' => true, 'message' => 'KB category deleted']);
    }
}
