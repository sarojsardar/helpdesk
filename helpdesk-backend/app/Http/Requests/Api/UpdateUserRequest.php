<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'role'       => 'sometimes|in:admin,staff,user',
            'department' => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
        ];
    }
}
