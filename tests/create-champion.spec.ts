import { test, expect, Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");
});

const CHAMPION = {
  sport: "testSport",
  award: "testAward",
  year: "1234",
  description: "testDescription",
};

const addChampion = async (page) => {
  // Create 1st champion.
  await page.locator("#add").click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/ui/uploadChampion.html");

  await page.fill("#sport", CHAMPION.sport);
  await page.fill("#award", CHAMPION.award);
  await page.fill("#year", CHAMPION.year);
  await page.fill("#description", CHAMPION.description);
  await page.setInputFiles(
    "#fileUploader",
    "./tests/images/WoC Images/08 1958 Football/1958 Football Team Photo.jpg"
  );

  await page.locator("#submitButton").press("Enter");
  await expect(page).toHaveURL("http://127.0.0.1:3000/ui/mainNavigation.html");
};

const deleteChampion = async (page) => {
  await page.goto("http://127.0.0.1:3000/ui/listChampions.html");
  // Locate elements, this locator points to a list.
  const images = await page.locator("text=Delete champion").nth(1);
  await images.click();
};

test.describe("CRUD champions", () => {
  test("add/delete bulk champions", async ({ page }) => {
    for (let i = 0; i < 22; i++) {
      await addChampion(page);
      await deleteChampion(page);
    }
  });
});
