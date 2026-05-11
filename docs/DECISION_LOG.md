# DECISION LOG: Hermes Desktop Studio — Karar Kayıtları

**Tarih:** 2026-05-11  
**Proje:** hermes-studio-desktop

---

## Karar 1: Desktop-First Mimarisi

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | Desktop-first (Tauri + React) mi TUI (Textual) mi? |
| **Secim** | Desktop-first — Tauri v2 + React 19 |
| **Gerekçe** | Terminal TUI sınırları: panel docking zor, preview yok, theming limited, accessibility zayıf |
| **Alternatifler** | TUI (Textual) — reddedildi |
| **Risk** | Düşük — Tauri olgun bir framework |
| **Sonuc** | Uygulandı |

---

## Karar 2: Adapter-First Mimari

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | UI doğrudan Hermes'e mi bağlansın yoksa adapter üzerinden mi? |
| **Secim** | Adapter-first — UI → Studio Adapter → Hermes |
| **Gerekçe** | Encapsulation, mock edilebilirlik, OpenAPI contract, testability |
| **Alternatifler** | Direct Hermes API — coupling artar, test zorlaşır |
| **Risk** | Orta — Extra network hop (2ms local) |
| **Sonuc** | Uygulandı |

---

## Karar 3: Studio-Owned Storage

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | Studio verisi Hermes state.db'de mi tutulsun yoksa ayrı studio.db'de mi? |
| **Secim** | Studio-owned — `studio.db` (SQLite) Hermes `state.db`'den ayrı |
| **Gerekçe** | Hermes core değişikliği etkilemez, read-only guarantee kolay, veri izolasyonu |
| **Alternatifler** | Hermes state.db — writes riskli, coupling yüksek |
| **Risk** | Düşük — Veri tekrarı (küçük metadata) |
| **Sonuc** | Uygulandı |

---

## Karar 4: Backend Mod Seçimi

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | Hangi backend mod varsayılan olsun? |
| **Secim** | `local` (HermesCliBackend) varsayılan, `gateway` opsiyonel |
| **Gerekçe** | Local Hermes kurulumları gateway gerektirmemeli |
| **Alternatifler** | `gateway` varsayılan — reddedildi (extra setup gerektirir) |
| **Sonuc** | Uygulandı |

---

## Karar 5: Theme Sistemi

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | Sadece renk teması mı yoksa tam concept pack sistemi mi? |
| **Secim** | Concept pack — TOML-based, semantic slot system |
| **Gerekçe** | Minecraft, Minions, LOTR gibi temalar — sadece renk değil kavram |
| **Alternatifler** | Sadece CSS variable renk teması — yetersiz |
| **Risk** | Orta — TOML parsing overhead, validation complexity |
| **Sonuc** | Uygulandı |

---

## Karar 6: E2E Test Framework

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | E2E için Playwright mı Cypress mi? |
| **Secim** | Playwright |
| **Gerekçe** | Tauri uyumlu, Rust backend, headless desteği, visual testing |
| **Alternatifler** | Cypress — Tauri desteği zayıf |
| **Sonuc** | Uygulandı |

---

## Karar 7: Store Yönetimi

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | 32 Zustand store — gerekli mi yoksa konsolidasyon mümkün mü? |
| **Durum** | BEKLEMEDE — Karar verilmedi |
| **Kisitlama** | Breaking change istemiyoruz |
| **Sorulacak** | ChatGPT'ye sorulacak |

---

## Karar 8: studio_routes.py Refactor

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | 2516 satırlık studio_routes.py'yi parçalama |
| **Durum** | IMPLEMENTASYON BEKLENİYOR |
| **Risk** | Yüksek — Breaking change potansiyeli |
| **Yaklasim** | Route gruplarına göre ayır, include et |

---

## Karar 9: Release Strategy

| Alan | Deger |
|------|-------|
| **Tarih** | 2026-05-11 |
| **Karar** | v0.1.0'dan sonra alpha/beta/GA stratejisi |
| **Durum** | BEKLEMEDE |
| **Sorulacak** | ChatGPT'ye danışılacak |

---

## Bekleyen Kararlar

| # | Konu | Aciliyet | Sahne |
|---|------|----------|-------|
| 1 | Store konsolidasyonu (32 store) | Orta | Refactor |
| 2 | Release strategy (alpha/beta/GA) | Yüksek | Release |
| 3 | studio_routes.py refactor approach | Orta | Implementation |
| 4 | CI/CD pipeline design | Yüksek | Infrastructure |

---

*DECISION LOG oluşturuldu — 2026-05-11*