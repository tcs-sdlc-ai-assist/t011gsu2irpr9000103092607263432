import { afterEach, describe, expect, it, vi } from "vitest";
import { FREE_IMAGES, MAX_UPLOAD_BYTES, fileToDataUrl } from "./images";

const expectedCatalogue = [
  {
    id: "mountains",
    path: "/images/free/mountains.jpg",
    alt: "Snow-capped mountains rising above a quiet valley",
  },
  {
    id: "ocean",
    path: "/images/free/ocean.jpg",
    alt: "Ocean waves rolling toward a sunlit shore",
  },
  {
    id: "forest",
    path: "/images/free/forest.jpg",
    alt: "Tall forest trees surrounding a shaded woodland path",
  },
  {
    id: "city",
    path: "/images/free/city.jpg",
    alt: "Modern city skyline viewed across the waterfront",
  },
  {
    id: "desert",
    path: "/images/free/desert.jpg",
    alt: "Layered desert dunes beneath a clear open sky",
  },
  {
    id: "lake",
    path: "/images/free/lake.jpg",
    alt: "Still mountain lake reflecting the surrounding landscape",
  },
  {
    id: "street",
    path: "/images/free/street.jpg",
    alt: "Lively urban street lined with buildings and storefronts",
  },
  {
    id: "coffee",
    path: "/images/free/coffee.jpg",
    alt: "Fresh coffee served in a ceramic cup on a table",
  },
  {
    id: "books",
    path: "/images/free/books.jpg",
    alt: "Stack of well-read books arranged beside a window",
  },
  {
    id: "flowers",
    path: "/images/free/flowers.jpg",
    alt: "Colorful garden flowers blooming in natural light",
  },
];

const originalFileReader = globalThis.FileReader;

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.FileReader = originalFileReader;
});

describe("image utilities", () => {
  it("provides the exact ten-entry local image catalogue with descriptive alt text", () => {
    expect(FREE_IMAGES).toEqual(expectedCatalogue);
    expect(FREE_IMAGES).toHaveLength(10);
    expect(FREE_IMAGES.every(({ id, path, alt }) => (
      path === `/images/free/${id}.jpg` && alt.trim().split(/\s+/).length >= 5
    ))).toBe(true);
  });

  it("sets the upload limit to exactly 500 KB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(500 * 1024);
  });

  it.each([
    ["PNG", "image/png", "picture.png"],
    ["JPEG", "image/jpeg", "picture.jpg"],
  ])("converts a valid %s file to a data URL", async (_, type, name) => {
    const file = new File([new Uint8Array([1, 2, 3])], name, { type });

    const result = await fileToDataUrl(file);

    expect(result).toMatch(new RegExp(`^data:${type};base64,`));
  });

  it("rejects a missing file with a clear message", async () => {
    await expect(fileToDataUrl()).rejects.toThrow("No file provided.");
  });

  it.each([
    [new File(["text"], "notes.txt", { type: "text/plain" })],
    [new File(["unknown"], "unknown.bin")],
  ])("rejects a file without an image MIME type", async (file) => {
    await expect(fileToDataUrl(file)).rejects.toThrow(/valid image MIME type/i);
  });

  it("accepts exactly 500 KB and rejects 500 KB plus one byte", async () => {
    class SuccessfulFileReader {
      readAsDataURL() {
        this.result = "data:image/png;base64,boundary";
        this.onload();
      }
    }

    globalThis.FileReader = SuccessfulFileReader;
    const boundaryFile = new File(
      [new Uint8Array(MAX_UPLOAD_BYTES)],
      "boundary.png",
      { type: "image/png" },
    );
    const oversizedFile = new File(
      [new Uint8Array(MAX_UPLOAD_BYTES + 1)],
      "oversized.png",
      { type: "image/png" },
    );

    await expect(fileToDataUrl(boundaryFile)).resolves.toBe(
      "data:image/png;base64,boundary",
    );
    await expect(fileToDataUrl(oversizedFile)).rejects.toThrow(/500 KB/i);
  });

  it("rejects a browser read failure descriptively", async () => {
    class FailingFileReader {
      readAsDataURL() {
        this.onerror();
      }
    }

    globalThis.FileReader = FailingFileReader;
    const file = new File(["image"], "broken.png", { type: "image/png" });

    await expect(fileToDataUrl(file)).rejects.toThrow(/could not be read/i);
  });

  it("rejects a non-string FileReader result descriptively", async () => {
    class NonStringFileReader {
      readAsDataURL() {
        this.result = new ArrayBuffer(2);
        this.onload();
      }
    }

    globalThis.FileReader = NonStringFileReader;
    const file = new File(["image"], "invalid.png", { type: "image/png" });

    await expect(fileToDataUrl(file)).rejects.toThrow(/invalid read result/i);
  });
});
