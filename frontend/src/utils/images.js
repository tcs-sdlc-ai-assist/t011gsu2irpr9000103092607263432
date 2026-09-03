/**
 * Provide curated image metadata and browser-native image file conversion.
 *
 * @module images
 */

/** Maximum accepted upload size in bytes (500 KB). */
export const MAX_UPLOAD_BYTES = 500 * 1024;

/** Curated local images available to image selection controls. */
export const FREE_IMAGES = [
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

/**
 * Convert an image file into a data URL without mutating the file.
 *
 * @param {File} file Browser file selected by the user.
 * @returns {Promise<string>} A promise resolving to the image data URL.
 * @throws {Error} Rejects when the file is absent, is not an image, exceeds
 *     500 KB, cannot be read, or produces a non-string result.
 */
export function fileToDataUrl(file) {
  if (!file) {
    return Promise.reject(new Error("No file provided."));
  }

  if (!file.type || !file.type.startsWith("image/")) {
    return Promise.reject(
      new Error("The selected file must have a valid image MIME type."),
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(
      new Error("The selected image exceeds the maximum size of 500 KB."),
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("The selected image produced an invalid read result."));
    };

    reader.onerror = () => {
      reject(new Error("The selected image could not be read."));
    };

    reader.readAsDataURL(file);
  });
}
