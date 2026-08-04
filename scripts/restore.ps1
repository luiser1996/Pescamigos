param([Parameter(Mandatory=$true)][string]$DatabaseDump,[Parameter(Mandatory=$true)][string]$PhotosArchive)
if(!(Test-Path -LiteralPath $DatabaseDump) -or !(Test-Path -LiteralPath $PhotosArchive)){throw "La copia debe contener base de datos y fotografías"}
Get-Content -Raw -LiteralPath $DatabaseDump | docker compose exec -T db pg_restore -U pescamigos -d pescamigos --clean --if-exists
$archive=[IO.Path]::GetFullPath($PhotosArchive)
docker compose run --rm -v "${archive}:/backup/photos.tar.gz:ro" app sh -c "tar -xzf /backup/photos.tar.gz -C /data/photos"
