import PropTypes from "prop-types";
import { FREE_IMAGES } from "../utils/images";

/**
 * Render an accessible catalogue of curated local images.
 *
 * @param {object} props Component properties.
 * @param {"single"|"multi"} [props.mode="single"] Selection behavior.
 * @param {string|string[]} [props.value=""] Current selected path or paths.
 * @param {Function} props.onChange Receives the next selected value.
 * @returns {JSX.Element} The image picker control.
 */
export default function ImagePicker({
  mode = "single",
  value = "",
  onChange,
}) {
  const selectedPaths = mode === "multi" && Array.isArray(value) ? value : [];

  /**
   * Toggle a catalogue path according to the configured selection mode.
   *
   * @param {string} path Local image path to toggle.
   * @returns {void}
   */
  const handleSelect = (path) => {
    if (mode === "multi") {
      if (selectedPaths.includes(path)) {
        onChange(selectedPaths.filter((selectedPath) => selectedPath !== path));
        return;
      }

      onChange([...selectedPaths, path]);
      return;
    }

    onChange(value === path ? "" : path);
  };

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:!border-white/10 dark:!bg-ink-900">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {FREE_IMAGES.map((image) => {
          const isSelected = mode === "multi"
            ? selectedPaths.includes(image.path)
            : value === image.path;

          return (
            <button
              key={image.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(image.path)}
              className={`overflow-hidden rounded-xl border-2 bg-slate-100 transition-transform duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-slate-100 dark:!bg-ink-900 ${
                isSelected
                  ? "border-signal-600 ring-2 ring-signal-200 dark:border-signal-500 dark:ring-signal-600/40"
                  : "border-slate-200 hover:border-signal-400 dark:border-slate-700 dark:hover:border-signal-500"
              }`}
            >
              <img
                src={image.path}
                alt={image.alt}
                loading="lazy"
                className="aspect-square h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

ImagePicker.propTypes = {
  mode: PropTypes.oneOf(["single", "multi"]),
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func.isRequired,
};
