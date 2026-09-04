<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="MTC GEAR - Equipment Inventory, Request, Approval, Checkout, Check-in, and Asset-Tracking System for Mountain Top Communications">

    <title>MTC GEAR — Equipment Inventory & Deployment Management</title>

    <!-- Google Fonts: Poppins (Brand Primary), DM Sans (Brand Secondary), JetBrains Mono (Asset IDs) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..800;1,9..40,300..800&family=JetBrains+Mono:wght@400;500;700&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#121A1C] text-[#CADEDF] font-sans antialiased selection:bg-[#386642] selection:text-[#FFEBCC] min-h-screen">
    <div id="root"></div>
</body>
</html>
