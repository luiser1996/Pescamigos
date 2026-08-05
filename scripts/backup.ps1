param([Parameter(Mandatory=$true)][string]$Destination)
$target = [IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force $target | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$databaseName = "database-$stamp.dump"
$containerDump = "/tmp/$databaseName"
try {
  docker compose exec -T db pg_dump -U pescamigos -Fc -f $containerDump pescamigos
  if ($LASTEXITCODE -ne 0) { throw "pg_dump no pudo crear la copia" }
  docker compose exec -T db pg_restore --list $containerDump | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "La copia de PostgreSQL no es un archivo valido" }
  docker compose cp "db:${containerDump}" (Join-Path $target $databaseName)
  if ($LASTEXITCODE -ne 0) { throw "No se pudo copiar la copia de PostgreSQL" }
}
finally {
  docker compose exec -T db rm -f $containerDump
}
docker compose run --rm -v "${target}:/backup" app sh -c "tar -czf /backup/photos-$stamp.tar.gz -C /data/photos ."
if ($LASTEXITCODE -ne 0) { throw "No se pudo crear la copia de fotografias" }
Get-FileHash (Join-Path $target $databaseName), (Join-Path $target "photos-$stamp.tar.gz") | Format-Table
