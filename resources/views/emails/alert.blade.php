<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #162224;
            color: #CADEDF;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 24px auto;
            background-color: #1D2729;
            border-radius: 12px;
            border: 1px solid #2D4044;
            overflow: hidden;
        }
        .header {
            background-color: #162224;
            padding: 24px;
            text-align: center;
            border-bottom: 2px solid #386642;
        }
        .logo-title {
            color: #FFEBCC;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin: 8px 0 0 0;
        }
        .logo-sub {
            color: #829FA1;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        .content {
            padding: 32px 24px;
        }
        .badge {
            display: inline-block;
            background-color: rgba(56, 102, 66, 0.25);
            color: #FFEBCC;
            border: 1px solid #386642;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .title {
            color: #FFFFFF;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 16px 0;
        }
        .message-box {
            background-color: #162224;
            border-left: 4px solid #386642;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 24px;
            color: #CADEDF;
            font-size: 14px;
            line-height: 1.5;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 13px;
        }
        .meta-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #2D4044;
        }
        .meta-table td.label {
            color: #829FA1;
            width: 35%;
            font-weight: 600;
        }
        .meta-table td.value {
            color: #FFFFFF;
            font-weight: 500;
        }
        .btn-container {
            text-align: center;
            margin: 28px 0 12px 0;
        }
        .btn {
            display: inline-block;
            background-color: #386642;
            color: #FFEBCC !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.02em;
        }
        .footer {
            background-color: #121A1C;
            padding: 20px;
            text-align: center;
            color: #829FA1;
            font-size: 11px;
            border-top: 1px solid #2D4044;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div style="font-size: 28px;">⛰️</div>
            <div class="logo-title">MOUNTAIN TOP COMMUNICATIONS</div>
            <div class="logo-sub">MTC GEAR Equipment Management</div>
        </div>
        <div class="content">
            <div class="badge">{{ strtoupper(str_replace('.', ' ', $event)) }}</div>
            <h2 class="title">{{ $title }}</h2>
            <div class="message-box">
                {{ $bodyMessage }}
            </div>

            @if(!empty($meta))
            <table class="meta-table">
                @foreach($meta as $label => $val)
                <tr>
                    <td class="label">{{ $label }}</td>
                    <td class="value">{{ is_array($val) ? implode(', ', $val) : $val }}</td>
                </tr>
                @endforeach
            </table>
            @endif

            @if(!empty($link))
            <div class="btn-container">
                <a href="{{ $link }}" class="btn">View in MTC GEAR</a>
            </div>
            @endif
        </div>
        <div class="footer">
            Mountain Top Communications (MTC) &bull; Production Equipment & Custody Tracking System<br>
            Sent automatically by MTC GEAR.
        </div>
    </div>
</body>
</html>
