import { useId, useState } from "react";
import PropTypes from "prop-types";
import { fileToDataUrl } from "../utils/images";

/**
 * Render an image upload control with atomic conversion and removable previews.
 *
 * @param {object} props Component properties.
 * @param {"single"|"multi"} [props.mode="single"] Upload behavior.
 * @param {string|string[]} [props.value=""] Current image or image collection.
 * @param {Function} props.onChange Receives the next image value.
 * @returns {JSX.Element} The image upload control.
 */
export default function ImageUpload({
  mode = "single",
  value = "",
  onChange,
}) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const galleryValues = mode === "multi" && Array.isArray(value) ? value : [];
  const previewValues = mode === "multi"
    ? galleryValues
    : typeof value === "string" && value
      ? [value]
      : [];
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  /**
   * Convert selected files and update the value only after the full batch passes.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event File input change event.
   * @returns {Promise<void>} A promise settled after conversion and cleanup.
   */
  const handleFiles = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      if (mode === "multi") {
        const convertedImages = await Promise.all(files.map(fileToDataUrl));
        onChange([...galleryValues, ...convertedImages]);
      } else {
        const convertedImage = await fileToDataUrl(files[0]);
        onChange(convertedImage);
      }
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "The selected image could not be processed.",
      );
    } finally {
      setIsProcessing(false);
      input.value = "";
    }
  };

  /**
   * Remove one preview while preserving all other gallery entries.
   *
   * @param {number} index Index of the preview to remove.
   * @returns {void}
   */
  const handleRemove = (index) => {
    setError("");

    if (mode === "multi") {
      onChange(galleryValues.filter((_, valueIndex) => valueIndex !== index));
      return;
    }

    onChange("");
  };

  const uploadLabel = mode === "multi"
    ? "Upload gallery images"
    : "Upload cover image";

  return (
    <div
      aria-busy={isProcessing}
      className="rounded-2xl border border-black/5 bg-white p-4 text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:!border-white/10 dark:!bg-ink-900"
    >
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:!bg-ink-900">
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          {uploadLabel}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple={mode === "multi"}
          disabled={isProcessing}
          aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
          aria-invalid={Boolean(error)}
          onChange={handleFiles}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-700 outline-none focus:border-signal-600 focus:ring-2 focus:ring-signal-100 file:mr-3 file:rounded-full file:border-0 file:bg-signal-50 file:px-3 file:py-2 file:font-medium file:text-signal-700 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:!bg-ink-900 dark:focus:!border-signal-500 dark:focus:!ring-signal-600/30 dark:file:bg-slate-700 dark:file:text-slate-100 dark:file:!bg-ink-800"
        />
        <p id={helpId} className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          Maximum 500 KB per image. Images are stored locally as base64 data.
        </p>
        {isProcessing && (
          <p role="status" className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Processing images…
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </div>

      {previewValues.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previewValues.map((source, index) => {
            const previewAlt = mode === "multi"
              ? `Gallery preview ${index + 1}`
              : "Cover preview";
            const removeLabel = mode === "multi"
              ? `Remove gallery image ${index + 1}`
              : "Remove cover image";

            return (
              <div
                key={`${source}-${index}`}
                className="relative overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700"
              >
                <img
                  src={source}
                  alt={previewAlt}
                  loading="lazy"
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  aria-label={removeLabel}
                  onClick={() => handleRemove(index)}
                  className="absolute right-2 top-2 rounded-full border border-white/20 bg-ink-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors duration-200 hover:bg-ink-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:!bg-ink-900 dark:hover:!bg-ink-800"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ImageUpload.propTypes = {
  mode: PropTypes.oneOf(["single", "multi"]),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func.isRequired,
};
