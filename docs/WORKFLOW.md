# WORKFLOW: Hermes Desktop Studio — Isletim Planı

**Tarih:** 2026-05-11  
**Durum:** TASLAK — Uygulama bekleniyor

---

## 1. Proje Tanımı

**Repo:** hermes-studio-desktop ( NousResearch/hermes-shell altında)  
**Mod:** Local-first company workflow  
**Amaç:** Bu projeyi anlayıp sağlam bir işletim planına bağlamak

---

## 2. Planning Cards (TAMAMLANDI)

| Kart | Durum | Çıktı |
|------|-------|-------|
| 📋 INTAKE | ✅ TAMAMLANDI | `docs/INTAKE.md` |
| 📦 PRODUCT | ✅ TAMAMLANDI | `docs/PRODUCT.md` |
| 🏗️ ARCHITECTURE | ✅ TAMAMLANDI | `docs/ARCHITECTURE.md` |

---

## 3. Implementation Backlog

### Priority 1 — Blockers
| ID | Kart | Assignee | Success Criteria |
|----|------|----------|-------------------|
| t_07cea097 | E2E Tauri Stub Fix | qa-worker | 27/27 E2E geçer |
| t_12ede552 | Release Artifact Build | release-worker | Linux AppImage + GitHub Release draft |
| t_73f7a955 | pnpm-workspace.yaml Fix | qa-worker | Git state temiz |

### Priority 2 — Quality
| ID | Kart | Assignee | Success Criteria |
|----|------|----------|-------------------|
| t_3b471218 | Ruff Lint Uyarilari | adapter-worker | 0 uyarı |
| t_64d050ff | Manual QA Checklist | qa-worker | Tüm item geçti |
| t_12e81273 | studio_routes.py Refactor | adapter-worker | 476 test geçer, API değişmez |
| t_96c060f7 | GitHub Branch Policy | qa-worker | Policy + PR template mevcut |

### Priority 3 — Infrastructure
| ID | Kart | Assignee | Success Criteria |
|----|------|----------|-------------------|
| t_c70ba093 | Pipeline Tanimi | orchestrator | `docs/PIPELINE.md` hazır |

---

## 4. Pipeline Gate'leri

Her implementation kartı tamamlandıktan sonra şu sıra çalışır:

```
[Implementation Card Complete]
         ↓
   test-worker
   (pytest + vitest)
         ↓
      qa-worker
   (lint + typecheck)
         ↓
    audit-worker
   (security scan)
         ↓
    docs-worker
   (doc update)
         ↓
    build gate
   (artifact build)
         ↓
   github-manager
   (push/PR)
```

### test-worker
```bash
# Python
.venv/bin/pytest -q

# Frontend
pnpm --filter @hermes-desktop-studio/desktop-studio test
```

### qa-worker
```bash
# TypeScript
pnpm run check:types

# Python
.venv/bin/ruff check packages/hermes_adapter/hermes_adapter
.venv/bin/mypy packages/hermes_adapter/hermes_adapter
```

### audit-worker
```bash
# Security
# (npm audit — pnpm için pnpm audit veya manual check)
.venv/bin/ruff check .  # Ruff zaten lint + some security
```

### docs-worker
```bash
# API doc update
# README güncelleme
# Yeni endpoint dokümantasyonu
```

### build gate
```bash
pnpm run build
pnpm tauri build
```

### github-manager
```bash
# Sadece github-manager ile push/PR
# Direct git push ENGELLENMİŞ
```

---

## 5. GitHub Yönetimi

### github-manager Zorunluluğu
- Tüm git push/PR işlemleri `github-manager` ile yapılır
- Direct `git push` engellenmiş sayılır (policy olarak)
- Branch oluşturma: `github-manager` üzerinden

### Branch Naming
```
feature/        — yeni özellik
fix/           — bug fix
chore/         — bakım, dependency
docs/          — dokümantasyon
refactor/      — kod refactor
```

### PR Template
```markdown
## Açıklama

## Değişiklikler

## Test
- [ ] Unit testler geçti
- [ ] Typecheck temiz
- [ ] E2E (varsa) geçti

## Checklist
- [ ] Pipeline gate'lerden geçti
- [ ] Dokümantasyon güncellendi
- [ ] Breaking change yok
```

---

## 6. Decision Policy

### Karar Alınamayan Durumlar
Ürün veya mimari karar alınamadığında, ChatGPT'ye danışılır.

### ChatGPT Prompt Formatı
```
[Bağlam] + [Sorunun kendisi] + [Kısıtlamalar] + [Beklenen çıktı formatı]
```

### Örnek Prompt (Türkçe)
```
[Bağlam] Hermes Desktop Studio projesinde 32 Zustand store var. 
Bazıları çok küçük (sadece 2-3 field) ve birleştirilebilir görünüyor.

[Sorun] Store konsolidasyonu yapmalı mıyız? 
Hangileri birleştirilebilir?

[Kısıtlamalar] 
- React 19 + Zustand 5 kullanıyoruz
- Breaking change istemiyoruz
- Mevcut store'lar farklı component'ler tarafından import ediliyor

[Beklenen çıktı] 
- Konsolidasyon önerisi (hangileri birleşmeli)
- Migration planı
- Risk değerlendirmesi
```

---

## 7. Decision Log

| Tarih | Karar | Gerekçe | Sonuç |
|-------|-------|---------|-------|
| 2026-05-11 | Desktop-first seçimi | Terminal TUI sınırları | Uygulandı |
| 2026-05-11 | Adapter-first mimari | Testability + contract | Uygulandı |
| 2026-05-11 | Studio-owned storage | Hermes core decoupling | Uygulandı |

---

## 8. Sonraki Adımlar

1. [ ] E2E stub fix → test-worker → qa-worker → release-worker
2. [ ] Ruff lint fix → test-worker → qa-worker
3. [ ] Release build → github-manager ile PR
4. [ ] Pipeline otomasyonu (GitHub Actions)
5. [ ] Ilk CI/CD run

---

*WORKFLOW tamamlandi — 2026-05-11*