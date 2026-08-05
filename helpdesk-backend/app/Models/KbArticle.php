<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class KbArticle extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'slug', 'body', 'excerpt', 'category_id', 'author_id',
        'is_published', 'is_internal', 'tags', 'published_at',
        'view_count', 'helpful_count', 'not_helpful_count',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'is_internal'  => 'boolean',
            'tags'         => 'array',
            'published_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title) . '-' . Str::random(5);
            }
        });
    }

    public function category() { return $this->belongsTo(KbCategory::class, 'category_id'); }
    public function author()   { return $this->belongsTo(User::class, 'author_id'); }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopePublicOnly($query)
    {
        return $query->where('is_internal', false);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('body', 'like', "%{$term}%")
              ->orWhereJsonContains('tags', $term);
        });
    }
}
