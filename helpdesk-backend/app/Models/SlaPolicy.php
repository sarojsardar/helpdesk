<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlaPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'priority',
        'response_minutes', 'resolution_minutes',
        'business_hours_only', 'is_active',
        'category_id', 'department_id',
    ];

    protected function casts(): array
    {
        return [
            'business_hours_only' => 'boolean',
            'is_active'           => 'boolean',
        ];
    }

    public function category()   { return $this->belongsTo(Category::class); }
    public function department() { return $this->belongsTo(Department::class); }

    /**
     * Find the best-matching SLA policy for a given ticket context.
     * Priority order: category+priority > department+priority > priority-only > fallback defaults.
     */
    public static function resolveForTicket(string $priority, ?int $categoryId = null, ?int $departmentId = null): ?self
    {
        // Try category-specific first
        if ($categoryId) {
            $policy = static::where('is_active', true)
                ->where('priority', $priority)
                ->where('category_id', $categoryId)
                ->first();
            if ($policy) return $policy;
        }

        // Try department-specific
        if ($departmentId) {
            $policy = static::where('is_active', true)
                ->where('priority', $priority)
                ->where('department_id', $departmentId)
                ->whereNull('category_id')
                ->first();
            if ($policy) return $policy;
        }

        // Fall back to global priority policy
        return static::where('is_active', true)
            ->where('priority', $priority)
            ->whereNull('category_id')
            ->whereNull('department_id')
            ->first();
    }
}
