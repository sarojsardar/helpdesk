<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'priority'    => $this->priority,
            'status'      => $this->status,
            'is_overdue'  => $this->isOverdue(),
            'is_due_soon' => $this->isDueSoon(),
            'user'        => $this->whenLoaded('user', fn() => [
                'id'   => $this->user->id,
                'name' => $this->user->name,
            ]),
            'assignee'    => $this->whenLoaded('assignee', fn() => $this->assignee ? [
                'id'   => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'category'    => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'created_at'  => $this->created_at?->toISOString(),
            'tags'        => $this->whenLoaded('tags', fn() =>
                $this->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color])
            ),
        ];
    }
}
