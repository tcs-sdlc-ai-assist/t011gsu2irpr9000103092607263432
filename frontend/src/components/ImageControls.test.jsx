import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ImagePicker from "./ImagePicker";
import ImageUpload from "./ImageUpload";
import { FREE_IMAGES, fileToDataUrl } from "../utils/images";

vi.mock("../utils/images", async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    fileToDataUrl: vi.fn(),
  };
});

/**
 * Render a stateful picker so interactions update the controlled value.
 *
 * @param {object} props Component properties.
 * @param {"single"|"multi"} props.mode Selection mode.
 * @param {string|string[]} props.initialValue Initial controlled value.
 * @returns {JSX.Element} Stateful image picker fixture.
 */
function PickerHarness({ mode, initialValue }) {
  const [value, setValue] = useState(initialValue);

  return <ImagePicker mode={mode} value={value} onChange={setValue} />;
}

/**
 * Render a stateful upload control so interactions update previews.
 *
 * @param {object} props Component properties.
 * @param {"single"|"multi"} props.mode Upload mode.
 * @param {string|string[]} props.initialValue Initial controlled value.
 * @returns {JSX.Element} Stateful image upload fixture.
 */
function UploadHarness({ mode, initialValue }) {
  const [value, setValue] = useState(initialValue);

  return <ImageUpload mode={mode} value={value} onChange={setValue} />;
}

beforeEach(() => {
  fileToDataUrl.mockReset();
  fileToDataUrl.mockImplementation(async (file) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("The selected file must have a valid image MIME type.");
    }

    if (file.size > 500 * 1024) {
      throw new Error("The selected image exceeds the maximum size of 500 KB.");
    }

    return `data:${file.type};base64,${file.name}`;
  });
});

describe("ImagePicker", () => {
  it("selects, deselects, and replaces a single image with accurate aria-pressed state", async () => {
    const user = userEvent.setup();
    render(<PickerHarness mode="single" initialValue="" />);
    const mountain = screen.getByRole("button", { name: FREE_IMAGES[0].alt });
    const ocean = screen.getByRole("button", { name: FREE_IMAGES[1].alt });

    expect(mountain).toHaveAttribute("aria-pressed", "false");
    await user.click(mountain);
    expect(mountain).toHaveAttribute("aria-pressed", "true");

    await user.click(ocean);
    expect(mountain).toHaveAttribute("aria-pressed", "false");
    expect(ocean).toHaveAttribute("aria-pressed", "true");

    await user.click(ocean);
    expect(ocean).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles multi-select membership without duplicates while preserving order", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const firstPath = FREE_IMAGES[0].path;
    const secondPath = FREE_IMAGES[1].path;
    const { rerender } = render(
      <ImagePicker mode="multi" value={[firstPath]} onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: FREE_IMAGES[1].alt }));
    expect(onChange).toHaveBeenLastCalledWith([firstPath, secondPath]);

    rerender(
      <ImagePicker
        mode="multi"
        value={[firstPath, secondPath]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: FREE_IMAGES[0].alt }));
    expect(onChange).toHaveBeenLastCalledWith([secondPath]);
  });

  it("renders all local catalogue thumbnails lazily with their exact alt text", () => {
    render(<ImagePicker value="" onChange={vi.fn()} />);

    FREE_IMAGES.forEach((image) => {
      const thumbnail = screen.getByAltText(image.alt);
      expect(thumbnail).toHaveAttribute("src", image.path);
      expect(thumbnail).toHaveAttribute("loading", "lazy");
    });
  });
});

describe("ImageUpload", () => {
  it("replaces a single cover, previews it lazily, and removes it", async () => {
    const user = userEvent.setup();
    render(<UploadHarness mode="single" initialValue="/images/free/lake.jpg" />);
    const input = screen.getByLabelText("Upload cover image");
    const file = new File(["new cover"], "cover.png", { type: "image/png" });

    await user.upload(input, file);

    const preview = await screen.findByAltText("Cover preview");
    expect(preview).toHaveAttribute("src", "data:image/png;base64,cover.png");
    expect(preview).toHaveAttribute("loading", "lazy");
    await user.click(screen.getByRole("button", { name: "Remove cover image" }));
    expect(screen.queryByAltText("Cover preview")).not.toBeInTheDocument();
  });

  it("appends two gallery uploads and removes only the first preview", async () => {
    const user = userEvent.setup();
    render(
      <UploadHarness
        mode="multi"
        initialValue={["/images/free/books.jpg"]}
      />,
    );
    const files = [
      new File(["one"], "one.jpg", { type: "image/jpeg" }),
      new File(["two"], "two.png", { type: "image/png" }),
    ];

    await user.upload(screen.getByLabelText("Upload gallery images"), files);

    expect(await screen.findByAltText("Gallery preview 1")).toHaveAttribute(
      "src",
      "/images/free/books.jpg",
    );
    expect(screen.getByAltText("Gallery preview 2")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,one.jpg",
    );
    expect(screen.getByAltText("Gallery preview 3")).toHaveAttribute(
      "src",
      "data:image/png;base64,two.png",
    );

    await user.click(
      screen.getByRole("button", { name: "Remove gallery image 1" }),
    );
    expect(screen.getByAltText("Gallery preview 1")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,one.jpg",
    );
    expect(screen.getByAltText("Gallery preview 2")).toHaveAttribute(
      "src",
      "data:image/png;base64,two.png",
    );
  });

  it.each([
    [
      "oversized image",
      new File([new Uint8Array(500 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
      /500 KB/i,
    ],
    [
      "non-image file",
      new File(["plain text"], "notes.txt", { type: "text/plain" }),
      /image MIME type/i,
    ],
  ])("shows an inline error for an %s and preserves the prior cover", async (_, file, message) => {
    const user = userEvent.setup({ applyAccept: false });
    render(
      <UploadHarness mode="single" initialValue="/images/free/coffee.jpg" />,
    );

    await user.upload(screen.getByLabelText("Upload cover image"), file);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByAltText("Cover preview")).toHaveAttribute(
      "src",
      "/images/free/coffee.jpg",
    );
  });

  it("does not partially append a gallery batch when any conversion fails", async () => {
    const user = userEvent.setup();
    fileToDataUrl.mockImplementation(async (file) => {
      if (file.name === "broken.png") {
        throw new Error("The selected image could not be read.");
      }

      return `data:${file.type};base64,${file.name}`;
    });
    render(
      <UploadHarness
        mode="multi"
        initialValue={["/images/free/forest.jpg"]}
      />,
    );
    const files = [
      new File(["valid"], "valid.png", { type: "image/png" }),
      new File(["broken"], "broken.png", { type: "image/png" }),
    ];

    await user.upload(screen.getByLabelText("Upload gallery images"), files);

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be read/i);
    const previews = screen.getAllByRole("img", { name: /Gallery preview/ });
    expect(previews).toHaveLength(1);
    expect(previews[0]).toHaveAttribute("src", "/images/free/forest.jpg");
  });

  it("renders accessible lazy previews with unique remove controls", () => {
    render(
      <ImageUpload
        mode="multi"
        value={["/images/free/city.jpg", "data:image/png;base64,uploaded"]}
        onChange={vi.fn()}
      />,
    );

    const previews = screen.getAllByRole("img", { name: /Gallery preview/ });
    expect(previews).toHaveLength(2);
    previews.forEach((preview) => {
      expect(preview).toHaveAttribute("loading", "lazy");
    });
    const previewGrid = previews[0].parentElement.parentElement;
    expect(
      within(previewGrid).getByRole("button", { name: "Remove gallery image 1" }),
    ).toBeInTheDocument();
    expect(
      within(previewGrid).getByRole("button", { name: "Remove gallery image 2" }),
    ).toBeInTheDocument();
  });
});
