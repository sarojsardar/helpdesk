<?php

use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BulkTicketController;
use App\Http\Controllers\Api\CannedResponseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\ReplyController;
use App\Http\Controllers\Api\SavedFilterController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketMergeController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public — strict rate limit on auth endpoints
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Authenticated — general rate limit
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Profile
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    // 2FA
    Route::post('/2fa/send',   [TwoFactorController::class, 'send']);
    Route::post('/2fa/verify', [TwoFactorController::class, 'verify']);

    // Categories (read for all, write for admin)
    Route::get('/categories',                   [CategoryController::class, 'index']);
    Route::post('/categories',                  [CategoryController::class, 'store']);
    Route::put('/categories/{category}',        [CategoryController::class, 'update']);
    Route::delete('/categories/{category}',     [CategoryController::class, 'destroy']);

    // Tags
    Route::get('/tags',                         [TagController::class, 'index']);
    Route::post('/tags',                        [TagController::class, 'store']);
    Route::put('/tags/{tag}',                   [TagController::class, 'update']);
    Route::delete('/tags/{tag}',                [TagController::class, 'destroy']);
    Route::put('/tickets/{ticket}/tags',        [TagController::class, 'syncTicketTags']);

    // Tickets
    Route::get('/tickets',                      [TicketController::class, 'index']);
    Route::post('/tickets',                     [TicketController::class, 'store']);
    Route::get('/tickets/{ticket}',             [TicketController::class, 'show']);
    Route::put('/tickets/{ticket}',             [TicketController::class, 'update']);
    Route::delete('/tickets/{ticket}',          [TicketController::class, 'destroy']);
    Route::patch('/tickets/{ticket}/status',    [TicketController::class, 'updateStatus']);
    Route::patch('/tickets/{ticket}/assign',    [TicketController::class, 'assign']);
    Route::post('/tickets/{ticket}/merge',      [TicketMergeController::class, 'merge']);

    // Bulk actions (admin)
    Route::post('/tickets/bulk',                [BulkTicketController::class, 'update']);

    // Replies
    Route::post('/tickets/{ticket}/replies',    [ReplyController::class, 'store']);

    // Attachments
    Route::post('/tickets/{ticket}/attachments', [AttachmentController::class, 'store']);
    Route::delete('/attachments/{attachment}',   [AttachmentController::class, 'destroy']);

    // Ratings
    Route::post('/tickets/{ticket}/rating',     [RatingController::class, 'store']);

    // Stats (admin only)
    Route::get('/stats', [StatsController::class, 'index']);

    // Users (admin)
    Route::get('/users',              [UserController::class, 'index']);
    Route::get('/users/agents',       [UserController::class, 'agents']);
    Route::put('/users/{user}',       [UserController::class, 'update']);

    // Notifications
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read',  [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',    [NotificationController::class, 'markAllRead']);

    // Canned Responses
    Route::get('/canned-responses',                     [CannedResponseController::class, 'index']);
    Route::post('/canned-responses',                    [CannedResponseController::class, 'store']);
    Route::put('/canned-responses/{cannedResponse}',    [CannedResponseController::class, 'update']);
    Route::delete('/canned-responses/{cannedResponse}', [CannedResponseController::class, 'destroy']);

    // Saved Filters
    Route::get('/saved-filters',                [SavedFilterController::class, 'index']);
    Route::post('/saved-filters',               [SavedFilterController::class, 'store']);
    Route::delete('/saved-filters/{savedFilter}', [SavedFilterController::class, 'destroy']);

    // Audit Log (admin)
    Route::get('/audit-log', [AuditLogController::class, 'index']);
});
