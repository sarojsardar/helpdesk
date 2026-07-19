<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'title'               => $this->title,
            'description'         => $this->description,
            'priority'            => $this->priority,
            'status'              => $this->status,
            'is_overdue'          => $this->isOverdue(),
            'is_due_soon'         => $this->isDueSoon(),
            'is_response_breached'=> $this->isResponseBreached(),
            'response_due_at'     => $this->response_due_at?->toISOString(),
            'resolution_due_at'   => $this->resolution_due_at?->toISOString(),
            'first_response_at'   => $this->first_response_at?->toISOString(),
            'resolved_at'         => $this->resolved_at?->toISOString(),
            'created_at'          => $this->created_at?->toISOString(),
            'user'                => $this->whenLoaded('user', fn() => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'assignee'            => $this->whenLoaded('assignee', fn() => $this->assignee ? [
                'id'   => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null),
            'category'            => $this->whenLoaded('category', fn() => $this->category ? [
                'id'   => $this->category->id,
                'name' => $this->category->name,
            ] : null),
            'replies'             => ReplyResource::collection($this->whenLoaded('replies')),
            'events'              => $this->whenLoaded('events', fn() =>
                $this->events->map(fn($e) => [
                    'id'         => $e->id,
                    'type'       => $e->type,
                    'payload'    => $e->payload,
                    'user'       => $e->user ? ['id' => $e->user->id, 'name' => $e->user->name, 'role' => $e->user->role] : null,
                    'created_at' => $e->created_at?->toISOString(),
                ])
            ),
            'rating'              => $this->whenLoaded('rating', fn() => $this->rating ? [
                'score'   => $this->rating->score,
                'comment' => $this->rating->comment,
            ] : null),
            'attachments'         => $this->whenLoaded('attachments', fn() =>
                $this->attachments->map(fn($a) => [
                    'id'            => $a->id,
                    'original_name' => $a->original_name,
                    'mime_type'     => $a->mime_type,
                    'size'          => $a->size,
                    'url'           => \Illuminate\Support\Facades\Storage::url($a->filename),
                    'created_at'    => $a->created_at?->toISOString(),
                ])
            ),
            'assigned_to'         => $this->assigned_to,
            'user_id'             => $this->user_id,
            'merged_into'         => $this->merged_into,
            'tags'                => $this->whenLoaded('tags', fn() =>
                $this->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'color' => $t->color])
            ),
        ];
    }
}
