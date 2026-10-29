import { expect, test } from "@playwright/test";

test("home explains the product", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("InterVibe")).toBeVisible();
  await expect(page.getByText("Sign in to start")).toBeVisible();
});

test("login asks for an email", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Sign in", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Send sign-in link")).toBeVisible();
});

test("setup without a session sends you to login", async ({ page }) => {
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login$/);
});
