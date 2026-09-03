import { expect, test } from "@playwright/test";

const session = {
  userId: "image-writer",
  username: "image-writer",
  displayName: "Image Writer",
  role: "user",
};

/** Capture client errors so successful-looking pages cannot hide failures. */
function capturePageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

/** Seed an authenticated browser with a deterministic post collection. */
async function seedStorage(page, posts = []) {
  await page.addInitScript(
    ({ localSession, localPosts }) => {
      localStorage.setItem(
        "writespace_session",
        JSON.stringify(localSession),
      );
      localStorage.setItem("writespace_posts", JSON.stringify(localPosts));
      localStorage.setItem("writespace_seeded", "true");
    },
    { localSession: session, localPosts: posts },
  );
}

/** Read the persisted post array from the application origin. */
async function readPosts(page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("writespace_posts") || "[]"),
  );
}

test("a writer mixes free and uploaded images while publishing a story", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedStorage(page);
  await page.goto("/write");

  const coverSection = page.getByRole("group", {
    name: "Cover image (optional)",
  });
  const gallerySection = page.getByRole("group", {
    name: "Image gallery (optional)",
  });

  await coverSection
    .getByRole("button", {
      name: "Snow-capped mountains rising above a quiet valley",
    })
    .click();
  await gallerySection
    .getByRole("button", {
      name: "Ocean waves rolling toward a sunlit shore",
    })
    .click();
  await gallerySection
    .getByRole("button", {
      name: "Tall forest trees surrounding a shaded woodland path",
    })
    .click();

  await coverSection.getByLabel("Upload cover image").setInputFiles({
    name: "uploaded-cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("playwright-cover"),
  });
  await expect(coverSection.getByAltText("Cover preview")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );

  await gallerySection.getByLabel("Upload gallery images").setInputFiles({
    name: "uploaded-gallery.png",
    mimeType: "image/png",
    buffer: Buffer.from("playwright-gallery"),
  });
  await expect(gallerySection.getByAltText("Gallery preview 3")).toHaveAttribute(
    "src",
    /^data:image\/png;base64,/,
  );
  await gallerySection
    .getByRole("button", { name: "Remove gallery image 1" })
    .click();

  await page.getByLabel("Title").fill("Image authoring journey");
  await page
    .getByLabel("Content")
    .fill("A complete story authored with local and uploaded images.");
  await page.getByRole("button", { name: "Publish story" }).click();
  await expect(
    page.getByRole("heading", { name: "Image authoring journey" }),
  ).toBeVisible();

  const posts = await readPosts(page);
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({
    title: "Image authoring journey",
    content: "A complete story authored with local and uploaded images.",
    authorId: session.userId,
    authorName: session.displayName,
    authorRole: session.role,
    gallery: [
      "/images/free/forest.jpg",
      "data:image/png;base64,cGxheXdyaWdodC1nYWxsZXJ5",
    ],
  });
  expect(posts[0].coverImage).toBe(
    "data:image/png;base64,cGxheXdyaWdodC1jb3Zlcg==",
  );
  expect(posts[0].id).toEqual(expect.any(String));
  expect(posts[0].id).not.toBe("");
  expect(Number.isNaN(Date.parse(posts[0].createdAt))).toBe(false);
  expect(errors).toEqual([]);
});

test("editing prefills image controls and preserves immutable metadata", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  const original = {
    id: "existing-image-post",
    title: "Existing image story",
    content: "Existing image content.",
    coverImage: "/images/free/mountains.jpg",
    gallery: ["/images/free/ocean.jpg", "/images/free/forest.jpg"],
    authorId: session.userId,
    authorName: session.displayName,
    authorRole: session.role,
    createdAt: "2024-08-09T10:11:12.000Z",
  };
  await seedStorage(page, [original]);
  await page.goto("/edit/existing-image-post");

  const coverSection = page.getByRole("group", {
    name: "Cover image (optional)",
  });
  const gallerySection = page.getByRole("group", {
    name: "Image gallery (optional)",
  });
  await expect(
    coverSection.getByRole("button", {
      name: "Snow-capped mountains rising above a quiet valley",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    gallerySection.getByRole("button", {
      name: "Ocean waves rolling toward a sunlit shore",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    gallerySection.getByRole("button", {
      name: "Tall forest trees surrounding a shaded woodland path",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(gallerySection.getByAltText("Gallery preview 1")).toBeVisible();
  await expect(gallerySection.getByAltText("Gallery preview 2")).toBeVisible();

  await coverSection
    .getByRole("button", {
      name: "Modern city skyline viewed across the waterfront",
    })
    .click();
  await gallerySection
    .getByRole("button", { name: "Remove gallery image 1" })
    .click();
  await page.getByLabel("Title").fill("Edited image story");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Edited image story" }),
  ).toBeVisible();

  const posts = await readPosts(page);
  expect(posts).toEqual([
    {
      ...original,
      title: "Edited image story",
      coverImage: "/images/free/city.jpg",
      gallery: ["/images/free/forest.jpg"],
    },
  ]);
  expect(posts[0].id).toBe(original.id);
  expect(posts[0].authorId).toBe(original.authorId);
  expect(posts[0].authorName).toBe(original.authorName);
  expect(posts[0].createdAt).toBe(original.createdAt);
  expect(errors).toEqual([]);
});

test("rejected uploads leave selected cover and gallery values unchanged", async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await seedStorage(page);
  await page.goto("/write");

  const coverSection = page.getByRole("group", {
    name: "Cover image (optional)",
  });
  const gallerySection = page.getByRole("group", {
    name: "Image gallery (optional)",
  });
  await coverSection
    .getByRole("button", {
      name: "Snow-capped mountains rising above a quiet valley",
    })
    .click();
  await gallerySection
    .getByRole("button", {
      name: "Ocean waves rolling toward a sunlit shore",
    })
    .click();

  await coverSection.getByLabel("Upload cover image").setInputFiles({
    name: "oversize.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(500 * 1024 + 1, 1),
  });
  await expect(coverSection.getByRole("alert")).toContainText(
    "exceeds the maximum size of 500 KB",
  );
  await expect(coverSection.getByAltText("Cover preview")).toHaveAttribute(
    "src",
    "/images/free/mountains.jpg",
  );

  const galleryUpload = gallerySection.getByLabel("Upload gallery images");
  await galleryUpload.evaluate((input) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(["not an image"], "notes.txt", { type: "text/plain" }),
    );
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(gallerySection.getByRole("alert")).toContainText(
    "must have a valid image MIME type",
  );
  await expect(
    gallerySection.getByRole("button", {
      name: "Ocean waves rolling toward a sunlit shore",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(gallerySection.getByAltText("Gallery preview 1")).toHaveAttribute(
    "src",
    "/images/free/ocean.jpg",
  );

  await page.getByLabel("Title").fill("Valid save after rejection");
  await page
    .getByLabel("Content")
    .fill("Rejected files never enter the persisted image fields.");
  await page.getByRole("button", { name: "Publish story" }).click();
  await expect(
    page.getByRole("heading", { name: "Valid save after rejection" }),
  ).toBeVisible();

  const posts = await readPosts(page);
  expect(posts).toHaveLength(1);
  expect(posts[0].coverImage).toBe("/images/free/mountains.jpg");
  expect(posts[0].gallery).toEqual(["/images/free/ocean.jpg"]);
  expect(JSON.stringify(posts[0])).not.toContain("oversize.png");
  expect(JSON.stringify(posts[0])).not.toContain("notes.txt");
  expect(posts[0]).toMatchObject({
    authorId: session.userId,
    authorName: session.displayName,
    authorRole: session.role,
  });
  expect(errors).toEqual([]);
});
