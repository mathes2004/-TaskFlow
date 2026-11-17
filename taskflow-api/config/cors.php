<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Only the SPA origin (scheme + host + port, no trailing slash). Never '*' with credentials.
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-XSRF-TOKEN', 'X-Requested-With', 'Accept'],

    'exposed_headers' => ['Retry-After'],

    'max_age' => 3600,

    // Needed so the browser sends and accepts the session cookie.
    'supports_credentials' => true,

];
