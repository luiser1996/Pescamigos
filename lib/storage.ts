import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root =
  process.env.PHOTO_STORAGE_PATH ?? path.join(process.cwd(), "storage");
export async function savePhoto(file: File) {
  const max = (Number(process.env.MAX_UPLOAD_MB) || 12) * 1024 * 1024;
  if (file.size > max) throw new Error("La foto supera el tamaño permitido");
  const input = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(input)
    .metadata()
    .catch(() => null);
  if (!meta || !["jpeg", "png", "webp"].includes(meta.format ?? ""))
    throw new Error(
      "Usa una imagen JPEG, PNG o WebP válida. HEIC no está disponible en este contenedor.",
    );
  const id = randomUUID();
  const temp = path.join(root, "tmp", id);
  const final = path.join(root, id.slice(0, 2));
  await mkdir(temp, { recursive: true });
  await mkdir(final, { recursive: true });
  try {
    const original = path.join(temp, `${id}.original`);
    const web = path.join(temp, `${id}.webp`);
    const thumb = path.join(temp, `${id}.thumb.webp`);
    await writeFile(original, input);
    await sharp(input)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(web);
    await sharp(input)
      .rotate()
      .resize(420, 300, { fit: "cover" })
      .webp({ quality: 76 })
      .toFile(thumb);
    const names = [original, web, thumb];
    const moved = [] as string[];
    for (const name of names) {
      const target = path.join(final, path.basename(name));
      await rename(name, target);
      moved.push(target);
    }
    await rm(temp, { recursive: true, force: true });
    return {
      originalPath: moved[0],
      webPath: moved[1],
      thumbnailPath: moved[2],
      mimeType: "image/webp",
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      sizeBytes: file.size,
    };
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
}
export async function removeSavedPhoto(paths: string[]) {
  for (const target of paths) {
    const resolved = path.resolve(target);
    if (resolved.startsWith(path.resolve(root) + path.sep))
      await rm(resolved, { force: true });
  }
}

export const saveImageAsset = savePhoto;

async function saveCroppedImage(
  file: File,
  focusX: number,
  focusY: number,
  zoom: number,
  aspect: number,
) {
  const max = (Number(process.env.MAX_UPLOAD_MB) || 12) * 1024 * 1024;
  if (file.size > max) throw new Error("La foto supera el tamaño permitido");
  const input = Buffer.from(await file.arrayBuffer());
  const rotated = await sharp(input)
    .rotate()
    .toBuffer({ resolveWithObject: true })
    .catch(() => null);
  if (!rotated || !["jpeg", "png", "webp"].includes(rotated.info.format))
    throw new Error("Usa una imagen JPEG, PNG o WebP válida");
  const sourceAspect = rotated.info.width / rotated.info.height;
  const baseWidth =
    sourceAspect >= aspect ? rotated.info.height * aspect : rotated.info.width;
  const baseHeight =
    sourceAspect >= aspect ? rotated.info.height : rotated.info.width / aspect;
  const safeZoom = Math.min(3, Math.max(1, zoom));
  const cropWidth = Math.max(1, Math.floor(baseWidth / safeZoom));
  const cropHeight = Math.max(1, Math.floor(baseHeight / safeZoom));
  const left = Math.round(
    ((rotated.info.width - cropWidth) * Math.min(100, Math.max(0, focusX))) /
      100,
  );
  const top = Math.round(
    ((rotated.info.height - cropHeight) * Math.min(100, Math.max(0, focusY))) /
      100,
  );
  const id = randomUUID();
  const temp = path.join(root, "tmp", id);
  const final = path.join(root, id.slice(0, 2));
  await mkdir(temp, { recursive: true });
  await mkdir(final, { recursive: true });
  const original = path.join(temp, `${id}.original`),
    web = path.join(temp, `${id}.webp`),
    thumb = path.join(temp, `${id}.thumb.webp`);
  try {
    await writeFile(original, input);
    const cropped = sharp(rotated.data).extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    });
    const outputWidth = aspect === 1 ? 800 : 1600;
    const outputHeight = Math.round(outputWidth / aspect);
    await cropped
      .clone()
      .resize(outputWidth, outputHeight)
      .webp({ quality: 84 })
      .toFile(web);
    await cropped.clone().resize(220, 220).webp({ quality: 78 }).toFile(thumb);
    const moved = [] as string[];
    for (const name of [original, web, thumb]) {
      const target = path.join(final, path.basename(name));
      await rename(name, target);
      moved.push(target);
    }
    await rm(temp, { recursive: true, force: true });
    return {
      originalPath: moved[0],
      webPath: moved[1],
      thumbnailPath: moved[2],
      mimeType: "image/webp",
      width: outputWidth,
      height: outputHeight,
      sizeBytes: file.size,
    };
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
}

export const saveCroppedAvatar = (
  file: File,
  x: number,
  y: number,
  zoom: number,
) => saveCroppedImage(file, x, y, zoom, 1);
export const saveCroppedCapture = (
  file: File,
  x: number,
  y: number,
  zoom: number,
) => saveCroppedImage(file, x, y, zoom, 4 / 3);
