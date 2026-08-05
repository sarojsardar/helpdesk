<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbArticle;
use Illuminate\Http\Request;

class KbArticleController extends Controller
{
    /**
     * List articles — users see only published public articles; staff/admin see all.
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $isStaff = in_array($user?->role, ['admin', 'staff']);

        $query = KbArticle::with(['category:id,name,slug', 'author:id,name'])
            ->when(!$isStaff, fn($q) => $q->published()->publicOnly())
            ->when($request->category_id, fn($q, $v) => $q->where('category_id', $v))
            ->when($request->search, fn($q, $v) => $q->search($v))
            ->when($request->is_internal && $isStaff, fn($q) => $q->where('is_internal', true))
            ->when($request->is_published !== null && $isStaff, fn($q) => $q->where('is_published', $request->boolean('is_published')))
            ->orderByDesc('published_at')
            ->orderByDesc('created_at');

        $paginated = $query->paginate(min((int) $request->per_page ?: 15, 50));

        return response()->json([
            'success' => true,
            'data'    => [
                'data'         => $paginated->items(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Show single article by slug or ID.
     */
    public function show(Request $request, string $slugOrId)
    {
        $user    = $request->user();
        $isStaff = in_array($user?->role, ['admin', 'staff']);

        $article = KbArticle::with(['category:id,name,slug', 'author:id,name'])
            ->where(fn($q) => $q->where('slug', $slugOrId)->orWhere('id', (int) $slugOrId))
            ->when(!$isStaff, fn($q) => $q->published()->publicOnly())
            ->firstOrFail();

        // Increment view count
        $article->increment('view_count');

        return response()->json(['success' => true, 'data' => $article]);
    }

    /**
     * Create a new article (admin/staff only).
     */
    public function store(Request $request)
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:280|unique:kb_articles,slug',
            'body'         => 'required|string',
            'excerpt'      => 'nullable|string|max:500',
            'category_id'  => 'nullable|exists:kb_categories,id',
            'is_published' => 'boolean',
            'is_internal'  => 'boolean',
            'tags'         => 'nullable|array',
            'tags.*'       => 'string|max:50',
        ]);

        $data['author_id'] = $request->user()->id;

        if (!empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        $article = KbArticle::create($data);

        return response()->json([
            'success' => true,
            'data'    => $article->load(['category:id,name', 'author:id,name']),
            'message' => 'Article created',
        ], 201);
    }

    /**
     * Update an article.
     */
    public function update(Request $request, KbArticle $kbArticle)
    {
        if (!in_array($request->user()->role, ['admin', 'staff'])) {
            abort(403);
        }

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:280|unique:kb_articles,slug,' . $kbArticle->id,
            'body'         => 'required|string',
            'excerpt'      => 'nullable|string|max:500',
            'category_id'  => 'nullable|exists:kb_categories,id',
            'is_published' => 'boolean',
            'is_internal'  => 'boolean',
            'tags'         => 'nullable|array',
            'tags.*'       => 'string|max:50',
        ]);

        // Set published_at when first publishing
        if (!empty($data['is_published']) && !$kbArticle->is_published) {
            $data['published_at'] = now();
        }

        $kbArticle->update($data);

        return response()->json([
            'success' => true,
            'data'    => $kbArticle->fresh()->load(['category:id,name', 'author:id,name']),
            'message' => 'Article updated',
        ]);
    }

    /**
     * Delete an article.
     */
    public function destroy(Request $request, KbArticle $kbArticle)
    {
        $this->authorize('manage', \App\Models\User::class);

        $kbArticle->delete();

        return response()->json(['success' => true, 'message' => 'Article deleted']);
    }

    /**
     * Record a helpful / not-helpful vote.
     */
    public function vote(Request $request, KbArticle $kbArticle)
    {
        $request->validate(['helpful' => 'required|boolean']);

        if ($request->boolean('helpful')) {
            $kbArticle->increment('helpful_count');
        } else {
            $kbArticle->increment('not_helpful_count');
        }

        return response()->json(['success' => true, 'message' => 'Feedback recorded']);
    }
}
