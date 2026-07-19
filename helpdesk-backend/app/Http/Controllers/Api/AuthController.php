<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user  = User::create($request->validated());
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => ['user' => new UserResource($user), 'token' => $token],
            'message' => 'Registration successful',
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        $success = $user && Hash::check($data['password'], $user->password);

        // Log the attempt
        if ($user) {
            LoginLog::create([
                'user_id'    => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success'    => $success,
                'logged_at'  => now(),
            ]);
        }

        if (!$success) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials.']]);
        }

        if (!$user->is_active) {
            return response()->json(['success' => false, 'error' => 'Account disabled.'], 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'success' => true,
            'data'    => ['user' => new UserResource($user), 'token' => $token],
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json(['success' => true, 'data' => new UserResource($request->user())]);
    }
}
