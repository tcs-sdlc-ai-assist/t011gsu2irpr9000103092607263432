import { expect, test } from "@playwright/test";

const adminSession = {
  userId: "admin",
  username: "admin",
  displayName: "Admin",
  role: "Admin",
};

const visualStory = {
  id: "visual-workflow-story",
  title: "A considered visual workflow",
  content: "Dynamic reader content proves the local story remains connected.",
  coverImage: "/images/free/mountains.jpg",
  gallery: ["/images/free/ocean.jpg", "/images/free/forest.jpg"],
  authorId: "admin",
  authorName: "Admin",
  authorRole: "Admin",
  createdAt: "2025-06-07T08:09:10.000Z",
};

/** Capture runtime failures and external font requests before navigation. */
function captureRuntimeEvidence(page) {
  const errors = [];
  const externalFontRequests = [];

  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(request.url())) {
      externalFontRequests.push(request.url());
    }
  });

  return { errors, externalFontRequests };
}

/** Seed deterministic authenticated workflow data before the app initializes. */
async function seedAuthenticatedWorkflow(page, { dark = true } = {}) {
  await page.addInitScript(
    ({ session, post, useDarkMode }) => {
      if (useDarkMode) localStorage.setItem("writespace_theme", "dark");
      localStorage.setItem("writespace_session", JSON.stringify(session));
      localStorage.setItem("writespace_posts", JSON.stringify([post]));
      localStorage.setItem(
        "writespace_users",
        JSON.stringify([
          {
            id: "workflow-writer",
            displayName: "Workflow Writer",
            username: "workflow-writer",
            password: "password",
            role: "user",
            createdAt: "2025-06-01T00:00:00.000Z",
          },
        ]),
      );
      localStorage.setItem("writespace_seeded", "true");
    },
    { session: adminSession, post: visualStory, useDarkMode: dark },
  );
}

/** Read the primary painted geometry of one element. */
async function paintedStyle(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      radius: style.borderRadius,
      font: style.fontFamily,
    };
  });
}

test("authenticated dark listing flows through reader and edit on ink surfaces", async ({
  page,
}) => {
  const evidence = captureRuntimeEvidence(page);
  await seedAuthenticatedWorkflow(page);
  await page.goto("/blogs");

  const storyLink = page.getByRole("link", { name: visualStory.title });
  const storyCard = storyLink.locator("xpath=ancestor::article[1]");
  await expect(storyLink).toBeVisible();
  await expect(storyCard.getByRole("img", { name: `${visualStory.title} cover` })).toBeVisible();
  expect(await paintedStyle(storyCard)).toMatchObject({
    background: "rgb(34, 36, 41)",
    radius: "16px",
  });

  const primaryCta = page.getByRole("link", { name: "Write a story" });
  await expect(primaryCta).toHaveCSS("background-color", "rgb(29, 110, 227)");
  await expect(primaryCta).toHaveCSS("border-radius", "9999px");
  expect((await paintedStyle(primaryCta)).font).toContain("Lexend Deca");

  await storyLink.click();
  const article = page.getByRole("article");
  await expect(page.getByText(visualStory.content)).toBeVisible();
  await expect(page.getByRole("img", { name: "Gallery image 1" })).toBeVisible();
  expect(await paintedStyle(article)).toMatchObject({
    background: "rgb(34, 36, 41)",
    radius: "16px",
  });

  await page.getByRole("link", { name: "Edit story" }).click();
  await expect(page.getByLabel("Title")).toHaveValue(visualStory.title);
  await expect(page.getByLabel("Content")).toHaveValue(visualStory.content);
  await expect(page.getByRole("button", { name: "Save changes" })).toHaveCSS(
    "background-color",
    "rgb(29, 110, 227)",
  );
  expect(evidence.externalFontRequests).toEqual([]);
  expect(evidence.errors).toEqual([]);
});

test("light login navigates to registration with rounded signal form styling", async ({
  page,
}) => {
  const evidence = captureRuntimeEvidence(page);
  await page.goto("/login");

  const loginCard = page
    .getByRole("heading", { name: "Log in to WriteSpace" })
    .locator("xpath=ancestor::div[1]");
  expect(await paintedStyle(loginCard)).toMatchObject({
    background: "rgb(255, 255, 255)",
    radius: "16px",
  });
  await expect(page.getByLabel("Username")).toHaveCSS("border-radius", "12px");
  await expect(page.getByRole("button", { name: "Log in" })).toHaveCSS(
    "background-color",
    "rgb(29, 110, 227)",
  );

  await page.getByRole("link", { name: "Create an account" }).click();
  const registrationCard = page
    .getByRole("heading", { name: "Create your account" })
    .locator("xpath=ancestor::div[1]");
  await expect(page.getByLabel("Confirm password")).toHaveCSS("border-radius", "12px");
  await page.getByLabel("Display name").click();
  await expect(page.getByLabel("Display name")).toBeFocused();
  expect(await paintedStyle(registrationCard)).toMatchObject({
    background: "rgb(255, 255, 255)",
    radius: "16px",
  });
  expect(evidence.externalFontRequests).toEqual([]);
  expect(evidence.errors).toEqual([]);
});

test("dark admin dashboard navigates to rounded user form and semantic table", async ({
  page,
}) => {
  const evidence = captureRuntimeEvidence(page);
  await seedAuthenticatedWorkflow(page);
  await page.goto("/admin");

  const statistic = page
    .getByText("Total Posts")
    .locator("xpath=ancestor::div[contains(@class, 'overflow-hidden')][1]");
  await expect(page.getByText("Total Posts").locator("xpath=following-sibling::dd")).toHaveText("1");
  expect(await paintedStyle(statistic)).toMatchObject({
    background: "rgb(34, 36, 41)",
    radius: "16px",
  });
  await expect(
    page.getByRole("heading", { name: "Recent posts" }).locator("xpath=ancestor::section[1]"),
  ).toHaveCSS("border-radius", "16px");

  await page.getByRole("link", { name: "Manage users" }).click();
  const form = page
    .getByRole("heading", { name: "Add a user" })
    .locator("xpath=ancestor::form[1]");
  await expect(form).toHaveCSS("background-color", "rgb(34, 36, 41)");
  await expect(form).toHaveCSS("border-radius", "16px");
  await expect(page.getByLabel("Role")).toHaveCSS("border-radius", "12px");
  await expect(page.getByRole("table")).toHaveCSS("border-radius", "16px");
  await expect(page.getByRole("columnheader", { name: "Display name" })).toBeVisible();
  await expect(page.getByText("Workflow Writer").first()).toBeVisible();
  expect(evidence.externalFontRequests).toEqual([]);
  expect(evidence.errors).toEqual([]);
});

test("mobile admin navigation reveals rounded user records", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const evidence = captureRuntimeEvidence(page);
  await seedAuthenticatedWorkflow(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Toggle navigation menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile authenticated navigation" })
    .getByRole("link", { name: "User management" })
    .click();

  const mobileRecords = page.locator("[aria-label='User records']");
  await expect(mobileRecords).toBeVisible();
  await expect(mobileRecords.getByText("Workflow Writer")).toBeVisible();
  const card = mobileRecords.locator("article").first();
  await expect(card).toHaveCSS("background-color", "rgb(34, 36, 41)");
  await expect(card).toHaveCSS("border-radius", "16px");
  await page.screenshot({
    path: "test-results/visual-workflow-mobile.png",
    fullPage: true,
  });
  expect(evidence.externalFontRequests).toEqual([]);
  expect(evidence.errors).toEqual([]);
});
