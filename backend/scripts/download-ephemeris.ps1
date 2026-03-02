# Download Swiss Ephemeris data files (planets + Moon) for in-house astrology calculation.
# Run from backend directory: .\scripts\download-ephemeris.ps1
# Or set -TargetDir to where you want the files (must match app.astrology.ephemeris-path).

param(
    [string]$TargetDir = "ephe",
    [string]$BaseUrl = "https://github.com/aloistr/swisseph/raw/master/ephe"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $TargetDir)) { New-Item -ItemType Directory -Path $TargetDir | Out-Null }

# Planets (sepl_*.se1) and Moon (semo_*.se1) – one file per 6-year span. Cover 1900–2060.
$ranges = 0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120, 126, 132, 138, 144, 150, 156, 162
foreach ($r in $ranges) {
    $sepl = "sepl_{0:D3}.se1" -f $r
    $semo = "semo_{0:D3}.se1" -f $r
    foreach ($f in $sepl, $semo) {
        $url = "$BaseUrl/$f"
        $out = Join-Path $TargetDir $f
        if (Test-Path $out) { Write-Host "Skip (exists): $f" }
        else {
            Write-Host "Downloading $f ..."
            try {
                Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
            } catch {
                Write-Warning "Failed to download $f : $_"
            }
        }
    }
}
Write-Host "Done. Ephemeris files in: $((Resolve-Path $TargetDir).Path)"
Write-Host "Set SWISS_EPHEMERIS_PATH or app.astrology.ephemeris-path to this path."
