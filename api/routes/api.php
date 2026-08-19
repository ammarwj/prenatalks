<?php

use App\Http\Controllers\Api\V1\Admin\ArticleController as AdminArticleController;
use App\Http\Controllers\Api\V1\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Api\V1\Admin\ChecklistItemController as AdminChecklistItemController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Api\V1\Admin\FormController as AdminFormController;
use App\Http\Controllers\Api\V1\Admin\FormExportController;
use App\Http\Controllers\Api\V1\Admin\QuestionnaireController as AdminQuestionnaireController;
use App\Http\Controllers\Api\V1\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\V1\Admin\TeamMemberController as AdminTeamMemberController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Admin\VideoController as AdminVideoController;
use App\Http\Controllers\Api\V1\ArticleController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CalculatorController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ChecklistController;
use App\Http\Controllers\Api\V1\ConsentController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\FaqController;
use App\Http\Controllers\Api\V1\FormController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\HealthWorkerAccessController;
use App\Http\Controllers\Api\V1\PregnancyController;
use App\Http\Controllers\Api\V1\QuestionnaireController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\TeamMemberController;
use App\Http\Controllers\Api\V1\VideoController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

// Endpoint komputasi publik — dibatasi agar tidak bisa dipakai membanjiri server.
Route::post('/calculator', CalculatorController::class)->middleware('throttle:30,1');

Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{slug}', [ArticleController::class, 'show']);
Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{slug}', [VideoController::class, 'show']);
Route::get('/faqs', [FaqController::class, 'index']);
Route::get('/categories', [CategoryController::class, 'index']);

// Hanya kelompok di Setting::PUBLIC_GROUPS — dipakai halaman /komunitas & /tentang.
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/team-members', [TeamMemberController::class, 'index']);

// Publik/login sesuai konfigurasi tiap form — dicek di dalam controller,
// bukan lewat middleware 'auth:api', karena aksesnya bergantung pada
// pengaturan form itu sendiri (requires_login), bukan blanket per-route.
Route::get('/forms/{form:slug}', [FormController::class, 'show']);
Route::post('/forms/{form:slug}/submit', [FormController::class, 'submit']);

Route::middleware('auth:api')->apiResource('pregnancies', PregnancyController::class)
    ->only(['index', 'store', 'show', 'update']);

Route::middleware('auth:api')->group(function () {
    Route::get('/dashboard', DashboardController::class);

    Route::get('/questionnaires/active', [QuestionnaireController::class, 'active']);

    Route::post('/assessments', [AssessmentController::class, 'store']);
    Route::patch('/assessments/{assessment}/answers', [AssessmentController::class, 'saveAnswer']);
    Route::post('/assessments/{assessment}/submit', [AssessmentController::class, 'submit']);
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/assessments/{assessment}', [AssessmentController::class, 'show']);
    Route::get('/assessments/{assessment}/pdf', [AssessmentController::class, 'pdf']);

    // Rute item pribadi didaftarkan sebelum `/checklist/{item}` agar segmen
    // "custom" tidak diikat sebagai ID item template (PRD §11.2 F-11).
    Route::get('/checklist', [ChecklistController::class, 'index']);
    Route::post('/checklist/custom', [ChecklistController::class, 'storeCustom']);
    Route::patch('/checklist/custom/{progress}', [ChecklistController::class, 'updateCustom']);
    Route::delete('/checklist/custom/{progress}', [ChecklistController::class, 'destroyCustom']);
    Route::patch('/checklist/{item}', [ChecklistController::class, 'update']);

    // F-15 · akses tenaga kesehatan. Rute "health-workers" didaftarkan
    // sebelum {consent} dengan alasan yang sama seperti "custom" di atas:
    // segmen tetap itu akan diikat sebagai id izin bila urutannya terbalik.
    Route::get('/consents/health-workers', [ConsentController::class, 'healthWorkers'])
        ->middleware('throttle:20,1');
    Route::get('/consents', [ConsentController::class, 'index']);
    Route::post('/consents', [ConsentController::class, 'store']);
    Route::get('/consents/{consent}/notes', [ConsentController::class, 'notes']);
    Route::post('/consents/{consent}/regenerate', [ConsentController::class, 'regenerate']);
    Route::delete('/consents/{consent}', [ConsentController::class, 'destroy']);

    Route::middleware('role:health_worker')->prefix('health-worker')->group(function () {
        // Throttle ketat: inilah satu-satunya endpoint yang menerima kode
        // tautan sebagai tebakan, jadi di sinilah brute force dihentikan.
        Route::post('/access', [HealthWorkerAccessController::class, 'redeem'])
            ->middleware('throttle:10,1');

        Route::get('/patients', [HealthWorkerAccessController::class, 'patients']);
        Route::get('/patients/{consent}', [HealthWorkerAccessController::class, 'show']);
        Route::get('/patients/{consent}/assessments/{assessment}', [HealthWorkerAccessController::class, 'assessment']);
        Route::post('/patients/{consent}/notes', [HealthWorkerAccessController::class, 'storeNote']);
    });

    Route::middleware('role:super_admin')->prefix('admin')->group(function () {
        Route::apiResource('questionnaires', AdminQuestionnaireController::class);

        Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);
        Route::apiResource('users', AdminUserController::class)->only(['index', 'show', 'update']);
    });

    Route::middleware('role:admin,super_admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);

        Route::apiResource('articles', AdminArticleController::class);
        Route::apiResource('videos', AdminVideoController::class);

        // Didaftarkan sebelum apiResource('faqs', ...) — {faq} pada rute
        // resource adalah wildcard yang akan mencoba mengikat "reorder"
        // sebagai ID bila urutannya terbalik.
        Route::patch('/faqs/reorder', [AdminFaqController::class, 'reorder']);
        Route::apiResource('faqs', AdminFaqController::class);

        // Alasan urutan sama seperti FAQ di atas: "reorder" harus dicocokkan
        // sebelum wildcard {checklist_item} milik apiResource.
        Route::patch('/checklist-items/reorder', [AdminChecklistItemController::class, 'reorder']);
        Route::apiResource('checklist-items', AdminChecklistItemController::class);

        Route::get('/settings', [AdminSettingController::class, 'index']);
        Route::put('/settings', [AdminSettingController::class, 'update']);

        // Alasan urutan sama seperti FAQ & item checklist di atas.
        Route::patch('/team-members/reorder', [AdminTeamMemberController::class, 'reorder']);
        Route::apiResource('team-members', AdminTeamMemberController::class);

        Route::apiResource('forms', AdminFormController::class);

        Route::get('/forms/{form}/submissions', [AdminFormController::class, 'submissions']);

        // Path tunggal "export" (bukan "exports") mengikuti PRD §11.2 persis
        // (`POST /admin/forms/{id}/export?format=csv|xlsx`); GET dipakai
        // untuk memantau status/riwayat, tidak didefinisikan literal di PRD
        // tapi diperlukan agar admin bisa polling saat ekspor lewat queue.
        Route::get('/forms/{form}/export', [FormExportController::class, 'index']);
        Route::post('/forms/{form}/export', [FormExportController::class, 'store'])
            ->middleware('throttle:3,60,form-export');
        Route::get('/forms/{form}/export/{export}/download', [FormExportController::class, 'download'])
            ->name('admin.forms.exports.download');
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
        Route::patch('/me', [AuthController::class, 'updateProfile']);

        // Throttle: menebak `current_password` di sini setara menebak kata
        // sandi lewat /auth/login, jadi pintunya dibatasi sama ketatnya.
        Route::post('/change-password', [AuthController::class, 'changePassword'])
            ->middleware('throttle:10,1');
    });
});
