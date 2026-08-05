<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class KbCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'parent_id', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::creating(function ($cat) {
            if (empty($cat->slug)) {
                $cat->slug = Str::slug($cat->name);
            }
        });
    }

    public function parent()   { return $this->belongsTo(KbCategory::class, 'parent_id'); }
    public function children() { return $this->hasMany(KbCategory::class, 'parent_id'); }
    public function articles() { return $this->hasMany(KbArticle::class, 'category_id'); }
}
