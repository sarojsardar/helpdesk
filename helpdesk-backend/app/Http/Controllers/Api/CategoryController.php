<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(['success' => true, 'data' => CategoryResource::collection(Category::withCount('tickets')->get())]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $this->authorize('manage', Category::class);
        $category = Category::create($request->validated());

        return response()->json(['success' => true, 'data' => new CategoryResource($category), 'message' => 'Category created'], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $this->authorize('manage', Category::class);
        $category->update($request->validated());

        return response()->json(['success' => true, 'data' => new CategoryResource($category)]);
    }

    public function destroy(Category $category)
    {
        $this->authorize('manage', Category::class);
        $category->delete();

        return response()->json(['success' => true, 'message' => 'Category deleted']);
    }
}
