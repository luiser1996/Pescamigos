param([Parameter(Mandatory=$true)][string]$Destination)
$target = [IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force $target | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker compose exec -T db pg_dump -U pescamigos -Fc pescamigos > (Join-Path $target "database-$stamp.dump")
docker compose run --rm -v "${target}:/backup" app sh -c "tar -czf /backup/photos-$stamp.tar.gz -C /data/photos ."
Get-FileHash (Join-Path $target "database-$stamp.dump"), (Join-Path $target "photos-$stamp.tar.gz") | Format-Table
