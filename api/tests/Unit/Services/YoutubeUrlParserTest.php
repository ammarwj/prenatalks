<?php

namespace Tests\Unit\Services;

use App\Services\YoutubeUrlParser;
use Tests\TestCase;

class YoutubeUrlParserTest extends TestCase
{
    public function test_extracts_id_from_watch_url(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
    }

    public function test_extracts_id_from_watch_url_with_extra_query_params(): void
    {
        $this->assertSame(
            'dQw4w9WgXcQ',
            YoutubeUrlParser::extractId('https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ&t=30s')
        );
    }

    public function test_extracts_id_from_short_url(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://youtu.be/dQw4w9WgXcQ'));
    }

    public function test_extracts_id_from_short_url_with_query(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://youtu.be/dQw4w9WgXcQ?t=10'));
    }

    public function test_extracts_id_from_embed_url(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://www.youtube.com/embed/dQw4w9WgXcQ'));
    }

    public function test_extracts_id_from_nocookie_embed_url(): void
    {
        $this->assertSame(
            'dQw4w9WgXcQ',
            YoutubeUrlParser::extractId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
        );
    }

    public function test_extracts_id_from_shorts_url(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://www.youtube.com/shorts/dQw4w9WgXcQ'));
    }

    public function test_extracts_id_from_mobile_url(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'));
    }

    public function test_accepts_a_bare_video_id(): void
    {
        $this->assertSame('dQw4w9WgXcQ', YoutubeUrlParser::extractId('dQw4w9WgXcQ'));
    }

    public function test_rejects_invalid_urls(): void
    {
        $this->assertNull(YoutubeUrlParser::extractId('https://example.com/watch?v=dQw4w9WgXcQ'));
        $this->assertNull(YoutubeUrlParser::extractId('not a url at all'));
        $this->assertNull(YoutubeUrlParser::extractId('https://www.youtube.com/'));
        $this->assertNull(YoutubeUrlParser::extractId(''));
    }

    public function test_is_valid_url_matches_extract_id(): void
    {
        $this->assertTrue(YoutubeUrlParser::isValidUrl('https://youtu.be/dQw4w9WgXcQ'));
        $this->assertFalse(YoutubeUrlParser::isValidUrl('https://vimeo.com/12345'));
    }
}
