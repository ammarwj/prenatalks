<?php

use App\Http\Controllers\Api\V1\Admin\FormController as AdminFormController;
use App\Http\Controllers\Api\V1\Admin\QuestionnaireController as AdminQuestionnaireController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalculatorController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\PregnancyController;
use App\Http\Controllers\Api\V1\QuestionnaireController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::post('/calculator', CalculatorController::class);

Route::middleware('auth:api')->apiResource('pregnancies', PregnancyController::class)
    ->only(['index', 'store', 'show', 'update']);

Route::middleware('auth:api')->group(function () {
    Route::get('/questionnaires/active', [QuestionnaireController::class, 'active']);

    Route::post('/assessments', [AssessmentController::class, 'store']);
    Route::patch('/assessments/{assessment}/answers', [AssessmentController::class, 'saveAnswer']);
    Route::post('/assessments/{assessment}/submit', [AssessmentController::class, 'submit']);
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);
    Route::get('/assessments/{assessment}/pdf', [AssessmentController::class, 'pdf']);

    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::apiResource('questionnaires', AdminQuestionnaireController::class);
    });

    Route::middleware('role:admin,super_admin')->prefix('admin')->group(function () {
        Route::apiResource('forms', AdminFormController::class);
    });
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});
