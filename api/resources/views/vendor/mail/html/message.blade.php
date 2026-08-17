<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.frontend_url')">
<img src="{{ config('app.frontend_url') }}/brand/logo.png" class="logo" alt="Logo PrenaTalks">
<span style="font-size: 20px; font-weight: 800; vertical-align: middle; margin-left: 10px;">
<span style="color: #ec4899;">Prena</span><span style="color: #7c3aed;">Talks</span>
</span>
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
Teman Ibu Hamil untuk Persalinan Aman
<br>
© {{ date('Y') }} {{ config('app.name') }}. {{ __('Semua hak dilindungi.') }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
