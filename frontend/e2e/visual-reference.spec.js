import { expect, test } from "@playwright/test";

/** Capture browser failures and external font requests for final assertions. */
function captureRuntimeEvidence(page) {
  const errors = [];
  const externalFontRequests = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(url)) {
      externalFontRequests.push(url);
    }
  });

  return { errors, externalFontRequests };
}

for (const mode of ["light", "dark"]) {
  test(`${mode} landing matches the local cinematic palette and typography`, async ({ page }) => {
    const evidence = captureRuntimeEvidence(page);
    if (mode === "dark") {
      await page.addInitScript(() => {
        localStorage.setItem("writespace_theme", "dark");
      });
    }

    await page.goto("/");

    const shell = page.locator("#root > div");
    const header = page.getByRole("banner");
    const hero = page.getByRole("heading", {
      level: 1,
      name: "Your thoughts. Your space. Beautifully simple.",
    }).locator("xpath=ancestor::section");
    const primaryCta = page.getByRole("link", { name: "Start writing" });
    const firstCard = page.locator("article").first();

    const styles = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const shellElement = document.querySelector("#root > div");
      const headerElement = document.querySelector("header");
      const cardElement = document.querySelector("article");
      const ctaElement = Array.from(document.querySelectorAll("a")).find(
        (link) => link.textContent.trim() === "Start writing",
      );
      return {
        bodyFont: body.fontFamily,
        bodyBackground: body.backgroundColor,
        shellBackground: getComputedStyle(shellElement).backgroundColor,
        headerBackground: getComputedStyle(headerElement).backgroundColor,
        cardBackground: getComputedStyle(cardElement).backgroundColor,
        ctaBackground: getComputedStyle(ctaElement).backgroundColor,
        ctaRadius: getComputedStyle(ctaElement).borderRadius,
        headerPosition: getComputedStyle(headerElement).position,
      };
    });

    expect(styles.bodyFont).toContain("Lexend Deca");
    expect(styles.headerPosition).toBe("sticky");
    expect(styles.ctaBackground).toBe("rgb(29, 110, 227)");
    expect(Number.parseFloat(styles.ctaRadius)).toBeGreaterThanOrEqual(9999);
    if (mode === "dark") {
      expect(styles.bodyBackground).toBe("rgb(25, 27, 31)");
      expect(styles.shellBackground).toBe("rgb(25, 27, 31)");
      expect(styles.headerBackground).toMatch(/^rgba\(25, 27, 31, 0\.9\)$/);
      expect(styles.cardBackground).toBe("rgb(34, 36, 41)");
    } else {
      expect(styles.bodyBackground).toBe("rgb(244, 244, 247)");
      expect(styles.shellBackground).toBe("rgb(244, 244, 247)");
      expect(styles.headerBackground).toMatch(/^rgba\(244, 244, 247, 0\.9\)$/);
      expect(styles.cardBackground).toBe("rgb(255, 255, 255)");
    }

    await expect(shell).toBeVisible();
    await expect(header).toBeVisible();
    await expect(hero.getByRole("img")).toHaveCount(3);
    await expect(primaryCta).toHaveCSS("background-color", "rgb(29, 110, 227)");
    await expect(firstCard).toHaveClass(/rounded-2xl/);
    await expect(page.getByRole("heading", { level: 2, name: "Latest stories" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(3);

    const heroSources = await hero.locator("img").evaluateAll((images) =>
      images.map((image) => ({
        source: image.getAttribute("src"),
        loading: image.getAttribute("loading"),
      })),
    );
    expect(heroSources).toEqual([
      { source: "/images/free/mountains.jpg", loading: "eager" },
      { source: "/images/free/books.jpg", loading: "lazy" },
      { source: "/images/free/coffee.jpg", loading: "lazy" },
    ]);
    expect(evidence.externalFontRequests).toEqual([]);
    expect(evidence.errors).toEqual([]);
  });
}

test("mobile navigation stays compact and preserves public destinations", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const evidence = captureRuntimeEvidence(page);
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Toggle navigation menu" });
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");

  const mobileNavigation = page.getByRole("navigation", { name: "Mobile public navigation" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  await expect(mobileNavigation.getByRole("link", { name: "Stories" })).toHaveAttribute("href", "/blogs");
  await expect(mobileNavigation.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
  await expect(mobileNavigation.locator("div").first()).toHaveCSS("border-radius", "16px");
  await page.screenshot({ path: "test-results/visual-reference-mobile.png", fullPage: true });

  expect(evidence.externalFontRequests).toEqual([]);
  expect(evidence.errors).toEqual([]);
});