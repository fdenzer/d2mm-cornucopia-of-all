# Windows Deployment (D2RMM + D2R)

Use this on your Windows gaming PC.

## Prerequisites

- D2RMM installed
- D2R installed
- This repo cloned on Windows
- PowerShell 5+ or PowerShell 7+

## 1) Install mod into D2RMM mods folder

Example:

```powershell
cd C:\path\to\d2mm-cornucopia-of-all
powershell -ExecutionPolicy Bypass -File .\deploy\windows\install-to-d2rmm.ps1 `
  -RepoRoot "C:\path\to\d2mm-cornucopia-of-all" `
  -D2RMMModsPath "C:\path\to\D2RMM\mods"
```

This creates/overwrites:

- `C:\path\to\D2RMM\mods\solo-cornucopia`

## 2) Build in D2RMM

1. Open D2RMM.
2. Enable `Solo Cornucopia`.
3. Pick config options.
4. Click `Install mods`.
5. Launch D2R in offline/single-player mode.

## 3) Optional: make a zip package

```powershell
cd C:\path\to\d2mm-cornucopia-of-all
powershell -ExecutionPolicy Bypass -File .\deploy\windows\package-zip.ps1 `
  -RepoRoot "C:\path\to\d2mm-cornucopia-of-all"
```

Output:

- `dist\solo-cornucopia.zip`

