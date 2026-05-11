# PRODUCT: Hermes Desktop Studio — Urun Vizyonu ve Yol Haritasi

**Tarih:** 2026-05-11  
**Durum:** TAMAMLANDI

---

## 1. Urun Vizyonu

**Neyi çözer:** Hermes Agent kullanıcıları terminal'in sınırlarını aşmak istiyor — panel docking, preview, theming, accessibility.

**Kimin için:** Kendi makinesinde Hermes Agent çalıştıran ve terminal yerine masaüstü GUI tercih eden geliştiriciler.

**Temel değer önerisi:** 
- Terminalden daha iyi panel yönetimi
- Görsel preview (HTML artifacts, screenshots, URLs)
- Tam theme/system — sadece renkler değil, kavramlar (Minecraft, Minions, LOTR temaları)
- Run Ledger ile çalışma geçmişi takibi

**Rakip farkı:** 
- TUI değil — tam masaüstü uygulaması
- Sadece chat değil — Run-centered workbench
- Concept pack sistemi — sadece renk teması değil

---

## 2. Kullanim Durumlari

### Birincil Use Case
**"Yeni bir Hermes run başlat, takip et, sonuçları incele"**
1. User New Run butonuna basar
2. Prompt girer, workspace seçer
3. SSE ile real-time event stream izler
4. Run Ledger'e kaydedilir
5. Run'dan Kanban card oluşturulabilir
6. Artifact oluşturulabilir

### İkincil Use Cases
- **Kanban board management** — Card CRUD, run/session linking
- **Theme switching** — Concept pack değişikliği anında UI değişir
- **Session management** — Geçmiş session'ları görüntüle
- **Artifact inspection** — HTML/log/markdown preview, A/B variant karşılaştırma
- **Context inspection** — Mevcut profile, model, workspace durumu
- **Approval workflow** — Tool approval bekletme/approve/deny

### Edge Cases
- Hermes unreachable — Auto fallback mock mode'a geçer
- Adapter down — Uyarı gösterir, composer disabled
- Large artifact — Boyut limiti var, truncated gösterilir
- Invalid theme TOML — Validasyon hatası gösterir, fallback theme'e döner

### Desteklenmeyen Use Caseler (Future)
- Cloud sync — Sadece local storage
- Multi-device — Tek makine odaklı
- Animated concept runtime — Statik panel/mode değişiklikleri
- Drag-and-drop Kanban — Explicit move butonları var

---

## 3. User Stories (MVP öncelik sırasına göre)

### Must-Have (P0)
- [ ] Run başlatma ve streaming takibi
- [ ] Run Ledger'e run geçmişinin kaydedilmesi
- [ ] Chat surface ile prompt gönderme
- [ ] Hermes Adapter bağlantı durumu gösterimi
- [ ] Basic Kanban CRUD (board, card oluşturma)
- [ ] Basic Artifact görüntüleme (text, markdown, HTML preview)
- [ ] Theme değiştirme (5 built-in theme)
- [ ] Backend mode göstergesi (local/gateway/mock/auto)

### Should-Have (P1)
- [ ] Session listeleme ve detay görüntüleme
- [ ] Artifact A/B variant karşılaştırma
- [ ] Context Inspector (profile, model, workspace bilgisi)
- [ ] Approval Center (pending approvalsı görüntüleme)
- [ ] Profile değiştirme ve activate
- [ ] Log viewing (source selector, streaming)
- [ ] Process Management cockpit

### Nice-to-Have (P2)
- [ ] Design Canvas — Figma URL import
- [ ] Checkpoints ve Worktrees
- [ ] Cron jobs görüntüleme
- [ ] Delegation tracking
- [ ] Global shortcuts (system tray, Ctrl+Shift+N)
- [ ] Browser evidence capture (Playwright)

---

## 4. Yol Haritasi (Roadmap)

### Kısa Vade (1-2 ay)
1. E2E Tauri stub fixture fix
2. Release packaging (Linux .AppImage, macOS .dmg, Windows .exe)
3. Manual QA çalıştırması
4. 3 Ruff lint uyarısı fix
5. pnpm-workspace.yaml cleanup

### Orta Vade (3-6 ay)
1. Visual diff UI for artifact revisions
2. Local concept-pack marketplace
3. Figma MCP metadata extraction
4. Full Hermes Kanban dispatch/claim UI
5. Rich MCP connection management
6. Checkpoints ve Worktrees UI

### Uzun Vade (6+ ay)
1. Animated concept runtime
2. Cloud sync (opsiyonel)
3. Multi-profile multi-agent orchestration
4. Mobile companion app

---

## 5. Release Strategisi

### Mevcut Durum
- Version: 0.1.0 (pre-release)
- Artifacts: Hiçbiri build edilmemiş
- CHANGELOG: Yok

### Önerilen Strateji
1. **v0.1.0-alpha** — Internal testing, E2E fix + QA
2. **v0.1.0-beta** — External beta, release artifacts
3. **v0.1.0** — GA, GitHub Release

### Geriye Dönük Uyumluluk
- OpenAPI contract değişiklikleri — breaking change olarak işaretlenir
- Concept pack schema — backward compatible eklentiler
- studio.db migration — otomatik

---

## 6. Prioritization (MoSCoW)

| öncelik | Ozellik | Reason |
|---------|---------|--------|
| Must | E2E fixture fix | Block tüm test suite |
| Must | Release build | Product yok |
| Must | Ruff lint fix | Code quality |
| Should | Manual QA | Risk azaltma |
| Should | Artifact A/B variants | Core feature |
| Should | Context Inspector | Core feature |
| Nice | Visual diff UI | Feature parity |
| Nice | Figma import | Feature parity |

---

## 7. Decision Log

### Karar 1: Desktop-first mi TUI-first mi?
**Seçim:** Desktop-first  
**Gerekçe:** Terminal TUI sınırları var — panel docking, preview, accessibility  
**Alternatif:** TUI (textual) — reddedildi, aynı sınırlar devam eder

### Karar 2: Adapter-first mi Direct Hermes mi?
**Seçim:** Adapter-first (UI → adapter → Hermes)  
**Gerekçe:** Encapsulation, mock ability, OpenAPI contract  
**Alternatif:** Direct Hermes API — coupling artar, test zorlaşır

### Karar 3: Studio-owned storage mu Hermes-owned mu?
**Seçim:** Studio-owned (studio.db)  
**Gerekçe:** Hermes core değişikliği yok, read-only garanti  
**Alternatif:** Hermes state.db — writes riskli, coupling

---

*PRODUCT tamamlandi — 2026-05-11*