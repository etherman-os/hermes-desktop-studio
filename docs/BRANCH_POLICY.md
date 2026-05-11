# Git Branch Politikası — Hermes Desktop Studio

**Proje:** hermes-studio-desktop  
**Etkin:** 2026-05-11

---

## 1. Branch Yapısı

```
main          ← Production-ready, her zaman deploy edilebilir
  ↑
develop       ← Entegrasyon branch'i (opsiyonel)
  ↑
feature/*     ← Yeni özellikler
fix/*         ← Bug fix'ler
chore/*       ← Bakım, dependency güncelleme
docs/*        ← Sadece dokümantasyon
refactor/*    ← Kod refactor (behavior değişikliği yok)
```

---

## 2. Branch Naming Convention

### Format
```
<type>/<ticket-id>-<short-description>
```

### Tipler
| Prefix | Kullanım | Örnek |
|--------|----------|-------|
| `feature/` | Yeni özellik | `feature/t_07cea097-e2e-stub-fix` |
| `fix/` | Bug fix | `fix/ruff-lint-warnings` |
| `chore/` | Bakım, dependency | `chore/update-dependencies` |
| `docs/` | Dokümantasyon | `docs/update-readme` |
| `refactor/` | Kod refactor | `refactor/studio-routes-split` |
| `release/` | Release hazırlık | `release/v0.1.1` |

### Kurallar
- Küçük harf kullan
- Tire `-` ile ayır, underscore `_` kullanma
- Açıklama 2-5 kelime
- Ticket ID varsa ekle

### Örnekler
```
feature/t_07cea097-e2e-stub-fix
fix/ruff-lint-up041
chore/update-tauri-v2
docs/update-readme-2026
refactor/studio-routes-modular
release/v0.1.1
```

---

## 3. Commit Convention

### Format
```
<type>(<scope>): <short description>

[optional body]
```

### Tipler
- `feat:` — Yeni özellik
- `fix:` — Bug fix
- `docs:` — Dokümantasyon
- `style:` — Formatting, missing semi colons, etc
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance

### Örnekler
```
feat(adapter): add new endpoint /studio/processes
fix(e2e): resolve Tauri stub event mock issue
docs(readme): update installation instructions
refactor(studio_routes): split into route modules
```

---

## 4. Merge Strategy

### Feature Branch → Main
1. Feature branch'de PR aç
2. Code review iste
3. CI pipeline tüm gate'lerden geçmeli
4. **Squash merge** tercih edilir (tidy commit history)

### Exception: Large Features
Büyük feature'lar için `rebase and merge` kullanılabilir.
Bölünmüş commit history isteniyorsa.

### Hotfix
- `fix/` branch'leri doğrudan `main`'e merge edilebilir
- Acil durumlarda GitHub UI "Rebase and merge" kullanılabilir

---

## 5. PR Review Zorunluluğu

### Minimum Review
- 1 approve gerekli
- Reviewer: Proje maintainer'ı veya senior developer

### Review Checklist
- [ ] Kod kalitesi
- [ ] Test coverage
- [ ] Breaking change yok
- [ ] API contract korunuyor
- [ ] Dokümantasyon güncellendi

---

## 6. Protection Rules (GitHub Settings)

### main branch
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

### develop branch (varsa)
- [ ] Require pull request reviews (1 approval)
- [ ] Require status checks
- [ ] Do not allow force pushes

---

## 7. Direct Push Engelleme

**Kural:** `main` ve `develop` branch'lerine doğrudan `git push` ENGELLENMİŞTİR.

**Yaptırım:**
- GitHub branch protection kuralları
- Pre-receive hook (GitHub Enterprise varsa)
- CI workflow engelleme

**Alternatif:** Tüm değişiklikler PR üzerinden yapılmalı.

---

## 8. Release Branch

### Format
```
release/v<major>.<minor>.<patch>
```

### Örnek
```
release/v0.1.1
release/v0.2.0
```

### Süreç
1. `release/vX.Y.Z` branch oluştur
2. Version bump ve CHANGELOG güncelle
3. Son testleri çalıştır
4. GitHub Release oluştur
5. `main`'e merge et
6. Tag at

---

*Branch policy oluşturuldu — 2026-05-11*