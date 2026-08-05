<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'manager_id', 'parent_id', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function manager()    { return $this->belongsTo(User::class, 'manager_id'); }
    public function parent()     { return $this->belongsTo(Department::class, 'parent_id'); }
    public function children()   { return $this->hasMany(Department::class, 'parent_id'); }
    public function users()      { return $this->hasMany(User::class); }
}
