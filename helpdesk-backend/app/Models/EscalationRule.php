<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EscalationRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'trigger_type', 'threshold_minutes',
        'action', 'target_user_id', 'applies_to_priority',
        'category_id', 'is_active', 'max_escalations',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function targetUser() { return $this->belongsTo(User::class, 'target_user_id'); }
    public function category()   { return $this->belongsTo(Category::class); }
    public function escalations() { return $this->hasMany(TicketEscalation::class); }
}
