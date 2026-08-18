import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let directory: string;
let savePhoto: typeof import("@/lib/storage").savePhoto;

const uploaded = (bytes: Uint8Array, name: string, type = "image/jpeg") =>
  new File([new Uint8Array(bytes).buffer], name, { type });

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "pescamigos-images-"));
  process.env.PHOTO_STORAGE_PATH = directory;
  process.env.MAX_UPLOAD_MB = "2";
  process.env.MAX_IMAGE_WIDTH = "1000";
  process.env.MAX_IMAGE_HEIGHT = "1000";
  process.env.MAX_IMAGE_PIXELS = "1000000";
  ({ savePhoto } = await import("@/lib/storage"));
});

afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("procesamiento seguro de imágenes", () => {
  it("acepta por firma una imagen válida aunque la extensión sea engañosa", async () => {
    const png = await sharp({
      create: { width: 40, height: 30, channels: 3, background: "blue" },
    })
      .png()
      .toBuffer();
    const saved = await savePhoto(uploaded(png, "captura.jpg"));
    expect(saved.mimeType).toBe("image/webp");
    expect((await readFile(saved.webPath)).subarray(8, 12).toString()).toBe(
      "WEBP",
    );
    expect(
      (await readFile(saved.thumbnailPath)).subarray(8, 12).toString(),
    ).toBe("WEBP");
  });

  it("rechaza un archivo falso con extensión y MIME de imagen", async () => {
    await expect(
      savePhoto(
        uploaded(new TextEncoder().encode("no es una imagen"), "falsa.jpg"),
      ),
    ).rejects.toThrow("JPEG, PNG o WebP");
  });

  it.each([
    ["GIF", new TextEncoder().encode("GIF89a")],
    [
      "SVG",
      new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    ],
    ["VIPS", new TextEncoder().encode("VIPS\0\0\0\0")],
  ])("rechaza el formato %s antes de procesarlo", async (_format, bytes) => {
    await expect(savePhoto(uploaded(bytes, "rechazada.bin"))).rejects.toThrow(
      "JPEG, PNG o WebP",
    );
  });

  it("rechaza TIFF aunque el contenido sea una imagen válida", async () => {
    const tiff = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "red" },
    })
      .tiff()
      .toBuffer();
    await expect(savePhoto(uploaded(tiff, "foto.jpg"))).rejects.toThrow(
      "JPEG, PNG o WebP",
    );
  });

  it("reduce imágenes que superan la anchura o altura configuradas", async () => {
    const png = await sharp({
      create: { width: 101, height: 20, channels: 3, background: "green" },
    })
      .png()
      .toBuffer();
    process.env.MAX_IMAGE_WIDTH = "100";
    const saved = await savePhoto(uploaded(png, "grande.png"));
    expect(saved.width).toBeLessThanOrEqual(100);
    process.env.MAX_IMAGE_WIDTH = "1000";
  });

  it("reduce automáticamente archivos que superan el tamaño configurado", async () => {
    process.env.MAX_UPLOAD_MB = "0.1";
    const pixels = Buffer.alloc(500 * 500 * 3);
    for (let index = 0; index < pixels.length; index += 1)
      pixels[index] = index % 251;
    const png = await sharp(pixels, {
      raw: { width: 500, height: 500, channels: 3 },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();
    const saved = await savePhoto(uploaded(png, "grande.png", "image/png"));
    expect((await readFile(saved.originalPath)).byteLength).toBeLessThanOrEqual(
      0.1 * 1024 * 1024,
    );
    process.env.MAX_UPLOAD_MB = "2";
  });
});
