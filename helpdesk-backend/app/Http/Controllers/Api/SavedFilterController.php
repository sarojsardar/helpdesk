<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavedFilter;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => $request->user()->savedFilters()->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => 'required|string|max:80',
            'filters' => 'required|array',
        ]);

        $filter = $request->user()->savedFilters()->create($data);

        return response()->json(['success' => true, 'data' => $filter], 201);
    }

    public function destroy(Request $request, SavedFilter $savedFilter)
    {
        abort_if($savedFilter->user_id !== $request->user()->id, 403);
        $savedFilter->delete();
        return response()->json(['success' => true]);
    }
}
