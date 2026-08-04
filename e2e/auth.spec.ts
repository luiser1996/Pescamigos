import { test, expect } from "@playwright/test";
test("la entrada privada no ofrece registro público", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", {
      name: /Qué alegría verte|Crea la cuenta propietaria/,
    }),
  ).toBeVisible();
  await expect(page.getByText(/registr/i)).toHaveCount(0);
});
