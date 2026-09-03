import { expect, test } from "@playwright/test";

const SESSION_KEY = "writespace_session";
const POSTS_KEY = "writespace_posts";
const SEED_KEY = "writespace_seeded";

const session = {
  userId: "render-writer",
  username: "render-writer",
  displayName: "Render Writer",
  role: "user",
};

/** Capture page and console errors for explicit end-of-test assertions. */
function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/** Install storage values before the application module evaluates. */
async function preloadStorage(page, { posts, seeded, localSession } = {}) {
  await page.addInitScript(
    ({ initialPosts, initialSeeded, initialSession }) => {
      if (sessionStorage.getItem("writespace_e2e_preloaded") === "true") return;
      sessionStorage.setItem("writespace_e2e_preloaded", "true");
      localStorage.removeItem("writespace_posts");
      localStorage.removeItem("writespace_seeded");
      localStorage.removeItem("writespace_session");
      if (initialPosts !== undefined) {
        localStorage.setItem("writespace_posts", JSON.stringify(initialPosts));
      }
      if (initialSeeded !== undefined) {
        localStorage.setItem("writespace_seeded", initialSeeded);
      }
      if (initialSession !== undefined) {
        localStorage.setItem(
          "writespace_session",
          JSON.stringify(initialSession),
        );
      }
    },
    {
      initialPosts: posts,
      initialSeeded: seeded,
      initialSession: localSession,
    },
  );
}

/** Read the application post collection from local storage. */
async function readPosts(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || "[]"), POSTS_KEY);
}

test("fresh storage seeds three fixed sample posts once and honors later deletion", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await preloadStorage(page);
  await page.goto("/");

  await expect(page.locator("article")).toHaveCount(3);
  const posts = await readPosts(page);
  expect(posts).toHaveLength(3);
  expect(new Set(posts.map((post) => post.id)).size).toBe(3);
  expect(new Set(posts.map((post) => post.coverImage)).size).toBe(3);
  posts.forEach((post) => {
    expect(post.authorId).toBe("admin");
    expect(post.authorName).toBe("Admin");
    expect(post.coverImage).toMatch(/^\/images\/free\//);
    expect(post.gallery).toEqual([]);
    expect(Number.isNaN(Date.parse(post.createdAt))).toBe(false);
    expect(Date.parse(post.createdAt)).toBeLessThan(Date.now());
  });
  expect(await page.evaluate((key) => localStorage.getItem(key), SEED_KEY)).toBe(
    "true",
  );

  await page.reload();
  expect(await readPosts(page)).toHaveLength(3);
  await page.evaluate((key) => localStorage.setItem(key, "[]"), POSTS_KEY);
  await page.reload();
  expect(await readPosts(page)).toEqual([]);
  expect(await page.evaluate((key) => localStorage.getItem(key), SEED_KEY)).toBe(
    "true",
  );
  expect(errors).toEqual([]);
});

test("an upgraded install keeps its custom post and records the seed flag", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  const customPost = {
    id: "custom-post",
    title: "Existing custom story",
    content: "This post predates sample seeding.",
    authorId: "custom-user",
    authorName: "Custom Writer",
    authorRole: "user",
    createdAt: "2023-11-10T09:00:00.000Z",
  };
  await preloadStorage(page, { posts: [customPost] });
  await page.goto("/");

  expect(await readPosts(page)).toEqual([customPost]);
  expect(await page.evaluate((key) => localStorage.getItem(key), SEED_KEY)).toBe(
    "true",
  );
  await expect(page.getByText("Existing custom story")).toBeVisible();
  expect(errors).toEqual([]);
});

test("authenticated listings and readers render valid images and safe placeholders", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  const posts = [
    {
      id: "with-images",
      title: "Story with images",
      content: "Reader content with a linked gallery.",
      coverImage: "/images/free/mountains.jpg",
      gallery: ["/images/free/ocean.jpg", "", null, "/images/free/forest.jpg"],
      authorId: session.userId,
      authorName: session.displayName,
      authorRole: session.role,
      createdAt: "2024-06-03T10:00:00.000Z",
    },
    {
      id: "without-cover",
      title: "Story without cover",
      content: "No cover content.",
      coverImage: "",
      gallery: [],
      authorId: "another-user",
      authorName: "Another Writer",
      authorRole: "user",
      createdAt: "2024-06-02T10:00:00.000Z",
    },
    {
      id: "legacy-post",
      title: "Legacy story",
      content: "Legacy content remains readable.",
      authorId: "legacy-user",
      authorName: "Legacy Writer",
      authorRole: "user",
      createdAt: "2024-06-01T10:00:00.000Z",
    },
  ];
  await preloadStorage(page, {
    posts,
    seeded: "true",
    localSession: session,
  });
  await page.goto("/blogs");

  const imageCard = page.getByRole("link", { name: "Story with images" }).locator("xpath=ancestor::article");
  await expect(imageCard.getByRole("img", { name: "Story with images cover" })).toHaveAttribute(
    "loading",
    "lazy",
  );
  for (const title of ["Story without cover", "Legacy story"]) {
    const card = page.getByRole("link", { name: title }).locator("xpath=ancestor::article");
    await expect(card.locator(".bg-gradient-to-r")).toHaveCount(1);
    await expect(card.locator("img")).toHaveCount(0);
  }

  await page.goto("/blog/with-images");
  const cover = page.getByRole("img", { name: "Story with images cover" });
  const heading = page.getByRole("heading", { name: "Story with images" });
  await expect(cover).toHaveAttribute("loading", "lazy");
  expect(
    await cover.evaluate((node, title) =>
      Boolean(node.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING),
    await heading.elementHandle()),
  ).toBe(true);
  await expect(page.getByText("Reader content with a linked gallery.")).toBeVisible();
  const gallery = page.getByRole("img", { name: /Gallery image/ });
  await expect(gallery).toHaveCount(2);
  await expect(gallery.first().locator("xpath=..")).toHaveAttribute("target", "_blank");
  await expect(gallery.first().locator("xpath=..")).toHaveAttribute("rel", "noreferrer");
  await expect(gallery.first()).toHaveAttribute("loading", "lazy");
  await expect(gallery.first().locator("xpath=../..")).toHaveClass(/grid-cols-2/);
  await expect(gallery.first().locator("xpath=../..")).toHaveClass(/md:grid-cols-3/);

  for (const id of ["without-cover", "legacy-post"]) {
    await page.goto(`/blog/${id}`);
    await expect(page.getByText(id === "legacy-post" ? "Legacy content remains readable." : "No cover content.")).toBeVisible();
    await expect(page.getByRole("img", { name: /cover|Gallery image/ })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
