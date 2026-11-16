# Roadmap (owner's technical audit brief, 2026-11-14)

- [ ] Stage 1: Audit every tool with real files in the browser; write report
- [ ] Stage 2: Fix broken tools; clear errors for corrupted, empty, password-protected, wrong-type files
- [ ] Stage 3: Sign PDF — choose page, position, size, preview
- [ ] Stage 4: Upload UX — file-type check, size limit shown, Start disabled until ready
- [ ] Stage 5: Languages 12 → 20 (add zh-Hant, pt, ja, ko, it, id, bn, nl)
- [ ] Stage 6: Design / mobile / accessibility pass, tool search
- [ ] Stage 7: Privacy & Terms pages accurate; performance review
- [ ] Stage 8: SEO + FAQ / formats / help pages
- [ ] Stage 9: Regression tests + final report

## Owner brief 2026-11-16 (security/QA audit)
- [x] P1 xlsx security update (official SheetJS tarball)
- [ ] P2 total size + file count limits for batches, shown in UI, tests
- [x] P3 HTML sanitizing: no scripts/handlers/remote URLs; tests
- [ ] P4 Compress = image-based note; Sign = drawn image, not digital certificate
- [ ] P5 Accessibility, translated aria labels, reduced motion
- [ ] P6 Privacy page matches real behavior
- [ ] P7 Real conversion tests per tool family
