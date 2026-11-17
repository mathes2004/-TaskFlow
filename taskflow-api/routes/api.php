<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public auth endpoints. No `guest` middleware: it answers an already-logged-in browser with an HTML redirect,
// which a JSON API client cannot use. The controllers handle that case (switching account) instead.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->middleware('throttle:password-reset');
Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset');


Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::patch('/user', [ProfileController::class, 'update']);
    Route::put('/user/password', [ProfileController::class, 'password'])->middleware('throttle:sensitive');
    Route::delete('/user', [ProfileController::class, 'destroy'])->middleware('throttle:sensitive');

    Route::get('/dashboard', DashboardController::class);
    Route::apiResource('tasks', TaskController::class); // index, store, show, update (PUT+PATCH), destroy
});
