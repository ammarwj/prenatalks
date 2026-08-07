# PrenaTalks API

Reserved for the Laravel 13 REST API described in `PRD.md` (bagian 6 — Arsitektur Sistem, bagian 13 — Struktur Proyek). Not yet scaffolded.

Expected structure once initialized:

```
api/
├─ app/
│  ├─ Http/Controllers/Api/V1/   Auth, Pregnancy, Assessment, Form, Article, Admin
│  ├─ Http/Requests/             validasi per endpoint
│  ├─ Http/Resources/            transformasi JSON
│  ├─ Models/
│  ├─ Services/                  PregnancyCalculator, RiskScoringService, ExportService
│  ├─ Policies/
│  └─ Jobs/                      ExportSubmissions, SendVerificationEmail
├─ database/migrations|seeders/
└─ routes/api.php
```

See `IMPLEMENTATION_CHECKLIST.md` at the repo root for the task-by-task backend checklist per feature.
