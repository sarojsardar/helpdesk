<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TicketTemplate;
use Illuminate\Http\Request;

class TicketTemplateController extends Controller
{
    /**
     * List all templates — active only for regular users, all for admin.
     */
    public function index(Request $request)
    {
        $query = TicketTemplate::with(['category:id,name'])
            ->when(!in_array($request->user()->role, ['admin', 'staff']), fn($q) => $q->where('is_active', true))
            ->orderBy('sort_order')
            ->orderBy('name');

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'description'          => 'nullable|string|max:500',
            'icon'                 => 'nullable|string|max:10',
            'description_template' => 'nullable|string|max:5000',
            'default_priority'     => 'in:low,medium,high,critical',
            'default_category_id'  => 'nullable|exists:categories,id',
            'custom_fields'        => 'nullable|array',
            'custom_fields.*.label'    => 'required_with:custom_fields|string|max:100',
            'custom_fields.*.type'     => 'required_with:custom_fields|in:text,textarea,select,checkbox,number,date',
            'custom_fields.*.required' => 'boolean',
            'custom_fields.*.options'  => 'nullable|array', // For select type
            'is_active'            => 'boolean',
            'sort_order'           => 'integer|min:0',
        ]);

        $data['created_by'] = $request->user()->id;
        $template = TicketTemplate::create($data);

        return response()->json([
            'success' => true,
            'data'    => $template->load('category:id,name'),
            'message' => 'Template created',
        ], 201);
    }

    public function update(Request $request, TicketTemplate $ticketTemplate)
    {
        $this->authorize('manage', \App\Models\User::class);

        $data = $request->validate([
            'name'                 => 'required|string|max:100',
            'description'          => 'nullable|string|max:500',
            'icon'                 => 'nullable|string|max:10',
            'description_template' => 'nullable|string|max:5000',
            'default_priority'     => 'in:low,medium,high,critical',
            'default_category_id'  => 'nullable|exists:categories,id',
            'custom_fields'        => 'nullable|array',
            'custom_fields.*.label'    => 'required_with:custom_fields|string|max:100',
            'custom_fields.*.type'     => 'required_with:custom_fields|in:text,textarea,select,checkbox,number,date',
            'custom_fields.*.required' => 'boolean',
            'custom_fields.*.options'  => 'nullable|array',
            'is_active'            => 'boolean',
            'sort_order'           => 'integer|min:0',
        ]);

        $ticketTemplate->update($data);

        return response()->json([
            'success' => true,
            'data'    => $ticketTemplate->fresh()->load('category:id,name'),
            'message' => 'Template updated',
        ]);
    }

    public function destroy(TicketTemplate $ticketTemplate)
    {
        $this->authorize('manage', \App\Models\User::class);

        $ticketTemplate->delete();

        return response()->json(['success' => true, 'message' => 'Template deleted']);
    }
}
