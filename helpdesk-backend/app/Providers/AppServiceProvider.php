<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\TicketPolicy;
use App\Policies\UserPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Ticket::class,  TicketPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(User::class,    UserPolicy::class);

        // Strict limiter for auth endpoints: 5 attempts per minute per IP
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'error'   => 'Too many attempts. Please wait a minute before trying again.',
                ], 429);
            });
        });

        // General API limiter: 60 requests per minute per user or IP
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip())->response(function () {
                return response()->json([
                    'success' => false,
                    'error'   => 'Too many requests. Please slow down.',
                ], 429);
            });
        });
    }
}
