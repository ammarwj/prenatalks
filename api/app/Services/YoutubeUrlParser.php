<?php

namespace App\Services;

/**
 * Ekstraksi & validasi ID video dari URL YouTube (PRD §9 F-09) — mendukung
 * format watch/embed/shorts/youtu.be, termasuk varian youtube-nocookie.com
 * (untuk admin yang menempel ulang URL embed).
 */
class YoutubeUrlParser
{
    private const ID_PATTERN = '[A-Za-z0-9_-]{11}';

    public static function extractId(string $url): ?string
    {
        $url = trim($url);

        if (preg_match('/^'.self::ID_PATTERN.'$/', $url)) {
            return $url;
        }

        $patterns = [
            '~youtube(?:-nocookie)?\.com/watch\?(?:.*&)?v=('.self::ID_PATTERN.')~i',
            '~youtube(?:-nocookie)?\.com/embed/('.self::ID_PATTERN.')~i',
            '~youtube(?:-nocookie)?\.com/shorts/('.self::ID_PATTERN.')~i',
            '~youtu\.be/('.self::ID_PATTERN.')~i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    public static function isValidUrl(string $url): bool
    {
        return self::extractId($url) !== null;
    }
}
