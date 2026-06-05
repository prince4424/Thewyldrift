import React from "react";
import { colorToCss } from "../lib/productVariants.js";

export default function ColorSwatchPicker({
  colors = [],
  selected,
  onSelect,
  size = "md",
  label = "Colour",
  showLabel = true,
  className = "",
}) {
  if (!colors.length) return null;

  return (
    <div className={`color-swatch-picker color-swatch-picker--${size} ${className}`.trim()}>
      {showLabel ? (
        <span className="color-swatch-picker__label" id="color-swatch-label">
          {label}
          {selected ? (
            <span className="color-swatch-picker__value"> · {selected}</span>
          ) : null}
        </span>
      ) : null}
      <div
        className="color-swatch-picker__row"
        role="listbox"
        aria-labelledby={showLabel ? "color-swatch-label" : undefined}
        aria-label={showLabel ? undefined : label}
      >
        {colors.map(({ color }) => {
          const isSelected = selected === color;
          return (
            <button
              key={color}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={color}
              title={color}
              className={`color-swatch${isSelected ? " color-swatch--selected" : ""}`}
              style={{ "--swatch-fill": colorToCss(color) }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect?.(color);
              }}
            >
              <span className="color-swatch__fill" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
