Add-Type -AssemblyName System.Drawing

New-Item -ItemType Directory -Force -Path public\icons | Out-Null
New-Item -ItemType Directory -Force -Path dist\icons | Out-Null

$srcPath = Join-Path (Get-Location) "dist\images\cataract_eye.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

foreach ($size in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, 0, 0, $size, $size)
    
    $out1 = Join-Path (Get-Location) "public\icons\icon-$size.png"
    $out2 = Join-Path (Get-Location) "dist\icons\icon-$size.png"
    $bmp.Save($out1, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($out2, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $bmp.Dispose()
    $g.Dispose()
}

$src.Dispose()
Write-Host "Icons generated successfully!"
