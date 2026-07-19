<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, Ticket $ticket)
    {
        $this->authorize('view', $ticket);

        $request->validate([
            'file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip,csv,log',
        ]);

        $file = $request->file('file');
        $path = $file->store("attachments/ticket-{$ticket->id}", 'public');

        $attachment = Attachment::create([
            'ticket_id'     => $ticket->id,
            'user_id'       => $request->user()->id,
            'filename'      => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $file->getMimeType(),
            'size'          => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'            => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type'     => $attachment->mime_type,
                'size'          => $attachment->size,
                'url'           => Storage::url($path),
            ],
        ], 201);
    }

    public function destroy(Request $request, Attachment $attachment)
    {
        if ($attachment->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            abort(403);
        }

        Storage::disk('public')->delete($attachment->filename);
        $attachment->delete();

        return response()->json(['success' => true]);
    }
}
