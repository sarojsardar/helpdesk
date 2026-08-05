<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'icon', 'description_template',
        'default_priority', 'default_category_id', 'custom_fields',
        'is_active', 'sort_order', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'is_active'     => 'boolean',
        ];
    }

    public function category() { return $this->belongsTo(Category::class, 'default_category_id'); }
    public function creator()  { return $this->belongsTo(User::class, 'created_by'); }
}
