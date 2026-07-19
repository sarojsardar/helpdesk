<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class TwoFactorController extends Controller
{
    // Step 1: send OTP to user's email
    public function send(Request $request)
    {
        $user = $request->user();
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'two_factor_pending_code'    => bcrypt($code),
            'two_factor_code_expires_at' => now()->addMinutes(10),
        ]);

        // Send via Laravel mail (uses configured mail driver)
        Mail::raw("Your HelpDesk verification code is: {$code}\n\nExpires in 10 minutes.", function ($m) use ($user) {
            $m->to($user->email)->subject('Your 2FA Verification Code');
        });

        return response()->json(['success' => true, 'message' => 'Verification code sent to your email.']);
    }

    // Step 2: verify OTP and toggle 2FA
    public function verify(Request $request)
    {
        $data = $request->validate(['code' => 'required|string|size:6']);
        $user = $request->user();

        abort_if(!$user->two_factor_pending_code, 422, 'No pending verification. Request a code first.');
        abort_if($user->two_factor_code_expires_at?->isPast(), 422, 'Code has expired. Request a new one.');
        abort_if(!password_verify($data['code'], $user->two_factor_pending_code), 422, 'Invalid code.');

        $enabled = !$user->two_factor_enabled;

        $user->update([
            'two_factor_enabled'         => $enabled,
            'two_factor_pending_code'    => null,
            'two_factor_code_expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $enabled ? '2FA enabled.' : '2FA disabled.',
            'two_factor_enabled' => $enabled,
        ]);
    }
}
