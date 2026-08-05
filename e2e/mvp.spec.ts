import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const password = "Pescamigos-2026";
let png: Buffer;

async function login(page: Page, username: "luis" | "dani") {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/catalogo/);
}

test.describe.serial("flujos críticos del MVP", () => {
  let adminCatchId = "";
  test.beforeAll(async () => {
    png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 40, g: 120, b: 180 },
      },
    })
      .png()
      .toBuffer();
  });
  test("1. inicio de sesión", async ({ page }) => {
    await login(page, "luis");
    await expect(
      page.getByRole("heading", { name: "Catálogo de especies" }),
    ).toBeVisible();
  });

  test("2. cambia entre catálogo propio, del amigo y conjunto", async ({
    page,
  }) => {
    await login(page, "luis");
    await page.getByRole("link", { name: "Dani" }).click();
    await expect(page).toHaveURL(/vista=e2e-member/);
    await page.getByRole("link", { name: "Pescamigos", exact: true }).click();
    await expect(page).toHaveURL(/vista=all/);
    await page.getByRole("link", { name: "Mi catálogo" }).click();
    await expect(page).toHaveURL(/vista=mine/);
  });

  test("3. crea la primera captura de una especie", async ({ page }) => {
    await login(page, "luis");
    await page.getByRole("link", { name: /Lucio E2E/ }).click();
    await page.getByRole("link", { name: /Añadir captura/ }).click();
    await page.getByLabel(/Lugar guardado/).selectOption("e2e-place");
    await page.getByLabel(/Longitud/).fill("52.5");
    await page
      .locator('input[name="photo"]')
      .setInputFiles({ name: "lucio.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: "Guardar captura" }).click();
    await expect(page.getByText(/Captura guardada/)).toBeVisible();
    adminCatchId = new URL(page.url()).pathname.split("/").at(-1) ?? "";
    expect(adminCatchId).not.toBe("");
  });

  test("4. desbloquea la especie para el pescador correcto", async ({
    page,
  }) => {
    await login(page, "luis");
    await page.goto("/catalogo?vista=mine");
    await expect(page.getByRole("link", { name: /Lucio E2E/ })).toContainText(
      "1 captura",
    );
  });

  test("5. la captura aparece en el catálogo conjunto", async ({ page }) => {
    await login(page, "luis");
    await page.goto("/catalogo?vista=all");
    await expect(page.getByRole("link", { name: /Lucio E2E/ })).toContainText(
      "1 captura",
    );
  });

  test("6. la captura no aparece en el catálogo personal del otro usuario", async ({
    page,
  }) => {
    await login(page, "dani");
    await page.goto("/catalogo?vista=e2e-member");
    await expect(page.getByRole("link", { name: /Lucio E2E/ })).toContainText(
      "Aún por descubrir",
    );
  });

  test("7. el lugar seleccionado aparece en el mapa", async ({ page }) => {
    await login(page, "luis");
    await page.goto("/mapa?place=e2e-place");
    await expect(page).toHaveURL(/place=e2e-place/);
    await expect(page.getByLabel("Mapa de lugares de pesca")).toBeVisible();
  });

  test("8. un MEMBER edita una captura propia", async ({ page }) => {
    await login(page, "dani");
    await page.goto("/capturas/e2e-dani-catch/editar");
    await page.getByLabel(/Longitud/).fill("33");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("33 cm")).toBeVisible();
  });

  test("9. un MEMBER no puede editar una captura ajena", async ({ page }) => {
    await login(page, "dani");
    await page.goto(`/capturas/${adminCatchId}/editar`);
    await expect(page).toHaveURL(new RegExp(`/capturas/${adminCatchId}$`));
    await expect(
      page.getByRole("button", { name: "Guardar cambios" }),
    ).toHaveCount(0);
  });

  test("10. un ADMIN puede editar cualquier captura", async ({ page }) => {
    await login(page, "luis");
    await page.goto("/capturas/e2e-dani-catch/editar");
    await page.getByLabel(/Longitud/).fill("34");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("34 cm")).toBeVisible();
  });
});
