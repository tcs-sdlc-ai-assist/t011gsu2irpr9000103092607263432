import { expect, test } from "@playwright/test";

const darkBackground = "rgb(25, 27, 31)";
const darkSurface = "rgb(34, 36, 41)";
const darkForeground = "rgb(241, 245, 249)";
const darkBorder = "rgba(255, 255, 255, 0.1)";
const darkInputBorder = "rgb(71, 85, 105)";

const adminSession = {
  userId: "admin",
  username: "admin",
  displayName: "Admin",
  role: "Admin",
};

/** Capture browser errors so dark-page checks cannot conceal client failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/** Seed dark mode and deterministic records before the application initializes. */
async function seedDarkStorage(page, session = adminSession) {
  await page.addInitScript((localSession) => {
    localStorage.setItem("writespace_theme", "dark");
    localStorage.setItem("writespace_session", JSON.stringify(localSession));
    localStorage.setItem(
      "writespace_posts",
      JSON.stringify([
        {
          id: "dark-post",
          title: "A dark mode story",
          content: "Readable content on a dark reader surface.",
          authorId: "admin",
          authorName: "Admin",
          authorRole: "Admin",
          createdAt: "2025-01-02T00:00:00.000Z",
        },
      ]),
    );
    localStorage.setItem(
      "writespace_users",
      JSON.stringify([
        {
          id: "writer-1",
          displayName: "Avery Writer",
          username: "writer",
          password: "password",
          role: "user",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ]),
    );
    localStorage.setItem("writespace_seeded", "true");
  }, session);
}

/** Read the key painted colors for one rendered element. */
async function paintedColors(locator) {
  return locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      background: styles.backgroundColor,
      color: styles.color,
      border: styles.borderTopColor,
    };
  });
}

/** Confirm that a page container uses the required dark page palette. */
async function expectDarkPage(page, headingName) {
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const heading = page.getByRole("heading", { name: headingName });
  await expect(heading).toBeVisible();
  const section = heading.locator("xpath=ancestor::section[1]");
  const colors = await paintedColors(section);
  expect(colors.background).toBe(darkBackground);
  expect(colors.color).toBe(darkForeground);
}

/** Confirm that a card or form uses the required dark surface palette. */
async function expectDarkSurface(locator) {
  const colors = await paintedColors(locator);
  expect(colors.background).toBe(darkSurface);
  expect(colors.color).toBe(darkForeground);
  expect(colors.border).toBe(darkBorder);
}

/** Confirm that a field uses the exact required dark input palette. */
async function expectDarkInput(locator) {
  const colors = await paintedColors(locator);
  expect(colors.background).toBe(darkSurface);
  expect(colors.color).toBe(darkForeground);
  expect(colors.border).toBe(darkInputBorder);
}

test("public links traverse landing, login, and registration dark surfaces", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedDarkStorage(page);
  await page.goto("/");

  await expectDarkPage(page, "Latest stories");
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "A dark mode story" })
      .locator("xpath=ancestor::article[1]"),
  );

  await page.getByRole("link", { name: "Log in" }).click();
  await expectDarkPage(page, "Log in to WriteSpace");
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "Log in to WriteSpace" })
      .locator("xpath=ancestor::div[1]"),
  );
  await expectDarkInput(page.getByLabel("Username"));

  await page.getByRole("link", { name: "Create an account" }).click();
  await expectDarkPage(page, "Create your account");
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "Create your account" })
      .locator("xpath=ancestor::div[1]"),
  );
  await expectDarkInput(page.getByLabel("Confirm password"));
  expect(errors).toEqual([]);
});

test("authenticated links traverse listing, reader, edit, and write dark surfaces", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedDarkStorage(page);
  await page.goto("/blogs");

  await expectDarkPage(page, "Stories");
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "A dark mode story" })
      .locator("xpath=ancestor::article[1]"),
  );

  await page.getByRole("link", { name: "A dark mode story" }).click();
  await expectDarkPage(page, "A dark mode story");
  await expectDarkSurface(page.locator("article"));
  await expect(page.getByText("Readable content on a dark reader surface.")).toBeVisible();

  await page.getByRole("link", { name: "Edit story" }).click();
  await expectDarkPage(page, "Edit story");
  await expect(page.getByLabel("Title")).toHaveValue("A dark mode story");
  await expectDarkInput(page.getByLabel("Title"));
  await expectDarkInput(page.getByLabel("Content"));

  await page.getByRole("link", { name: "WriteSpace" }).click();
  await page.getByRole("link", { name: "Write", exact: true }).click();
  await expectDarkPage(page, "Write a story");
  await expectDarkInput(page.getByLabel("Title"));
  await expectDarkInput(page.getByLabel("Content"));
  expect(errors).toEqual([]);
});

test("admin actions traverse dashboard and user-management dark surfaces", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedDarkStorage(page);
  await page.goto("/admin");

  await expectDarkPage(page, "Admin dashboard");
  const statistic = page
    .getByText("Total Posts")
    .locator("xpath=ancestor::div[contains(@class, 'overflow-hidden')][1]");
  await expectDarkSurface(statistic);
  await expect(statistic.locator("div").first()).toHaveClass(/from-violet-600/);
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "Recent posts" })
      .locator("xpath=ancestor::section[1]"),
  );

  await page.getByRole("link", { name: "Manage users" }).click();
  await expectDarkPage(page, "User management");
  await expectDarkSurface(
    page
      .getByRole("heading", { name: "Add a user" })
      .locator("xpath=ancestor::form[1]"),
  );
  await expectDarkInput(page.getByLabel("Display name"));
  await expectDarkInput(page.getByLabel("Role"));
  await expectDarkSurface(page.getByRole("table"));
  expect(errors).toEqual([]);
});

test("the dark authenticated mobile menu opens above a styled user record", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedDarkStorage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/users");

  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  const menuButton = page.getByRole("button", {
    name: "Toggle navigation menu",
  });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile authenticated navigation",
  });
  await expect(mobileNavigation).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "User management" }),
  ).toBeVisible();

  const mobileRecords = page.locator("[aria-label='User records']");
  await expect(mobileRecords).toBeVisible();
  await expectDarkSurface(mobileRecords.locator("article").first());
  await expect(mobileRecords.getByText("Avery Writer")).toBeVisible();
  expect(errors).toEqual([]);
});