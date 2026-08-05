<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::with(['manager:id,name', 'parent:id,name'])
            ->withCount('users')
            ->when($request->active_only, fn($q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'data' => $departments]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'        => 'required|string|max:100|unique:departments,name',
            'description' => 'nullable|string|max:500',
            'manager_id'  => 'nullable|exists:users,id',
            'parent_id'   => 'nullable|exists:departments,id',
            'is_active'   => 'boolean',
        ]);

        $department = Department::create($data);

        return response()->json([
            'success' => true,
            'data'    => $department->load(['manager:id,name', 'parent:id,name']),
            'message' => 'Department created',
        ], 201);
    }

    public function show(Department $department)
    {
        return response()->json([
            'success' => true,
            'data'    => $department->load(['manager:id,name', 'parent:id,name', 'children:id,name', 'users:id,name,email,role']),
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'        => 'required|string|max:100|unique:departments,name,' . $department->id,
            'description' => 'nullable|string|max:500',
            'manager_id'  => 'nullable|exists:users,id',
            'parent_id'   => 'nullable|exists:departments,id',
            'is_active'   => 'boolean',
        ]);

        // Prevent self-reference
        if (isset($data['parent_id']) && $data['parent_id'] == $department->id) {
            return response()->json(['success' => false, 'message' => 'Department cannot be its own parent.'], 422);
        }

        $department->update($data);

        return response()->json([
            'success' => true,
            'data'    => $department->fresh()->load(['manager:id,name', 'parent:id,name']),
            'message' => 'Department updated',
        ]);
    }

    public function destroy(Department $department)
    {
        $this->authorize('manage', \App\Models\User::class);

        if ($department->users()->count() > 0) {
            return response()->json(['success' => false, 'message' => 'Cannot delete department with assigned users.'], 422);
        }

        $department->delete();

        return response()->json(['success' => true, 'message' => 'Department deleted']);
    }
}
