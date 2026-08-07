<?php

use App\Traits\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Bentuk error standar — PRD §11.1: { success:false, message, errors? }
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $responder = new class
            {
                use ApiResponse;

                public function make(string $message, ?array $errors, int $status)
                {
                    return $this->error($message, $errors, $status);
                }
            };

            return match (true) {
                $e instanceof ValidationException => $responder->make(
                    'Data yang diberikan tidak valid',
                    $e->errors(),
                    422,
                ),
                $e instanceof AuthenticationException => $responder->make(
                    'Token tidak valid atau belum masuk',
                    null,
                    401,
                ),
                $e instanceof AuthorizationException => $responder->make(
                    'Anda tidak memiliki hak akses',
                    null,
                    403,
                ),
                $e instanceof TooManyRequestsHttpException => $responder->make(
                    'Terlalu banyak permintaan, coba lagi sebentar lagi',
                    null,
                    429,
                ),
                $e instanceof NotFoundHttpException => $responder->make(
                    'Data atau endpoint tidak ditemukan',
                    null,
                    404,
                ),
                $e instanceof HttpExceptionInterface => $responder->make(
                    $e->getMessage() ?: 'Terjadi kesalahan',
                    null,
                    $e->getStatusCode(),
                ),
                default => $responder->make(
                    config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada server',
                    null,
                    500,
                ),
            };
        });
    })->create();
