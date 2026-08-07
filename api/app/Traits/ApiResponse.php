<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Bentuk respons standar — PRD §11.1.
 */
trait ApiResponse
{
    protected function success(mixed $data = null, string $message = 'Data berhasil diambil', ?array $meta = null, int $status = 200): JsonResponse
    {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    protected function error(string $message = 'Terjadi kesalahan', ?array $errors = null, int $status = 422): JsonResponse
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
