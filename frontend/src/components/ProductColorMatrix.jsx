import React from "react";
import {
  VARIANT_SIZES,
  applyStockToAllSizes,
  toggleColorSize,
} from "../lib/variantMatrix.js";

function ColorImagePreview({ file, savedUrl, label, emptyMessage }) {
  const [objectUrl, setObjectUrl] = React.useState("");

  React.useEffect(() => {
    if (!file) {
      setObjectUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const src = objectUrl || savedUrl || "";
  if (!src) {
    return <p className="image-preview-empty">{emptyMessage}</p>;
  }

  return (
    <div className="admin-variant-preview admin-color-preview">
      <img src={src} alt="" loading="lazy" />
      <span className="admin-variant-preview-badge">{label}</span>
    </div>
  );
}

export default function ProductColorMatrix({
  colorGroups,
  onChangeGroup,
  onAddColor,
  onRemoveColor,
  onAutoGenerateSkus,
  productName,
}) {
  const allEnabledSizes = [...new Set(colorGroups.flatMap((g) => g.enabledSizes || []))].sort(
    (a, b) => VARIANT_SIZES.indexOf(a) - VARIANT_SIZES.indexOf(b)
  );

  return (
    <div className="admin-color-matrix">
      <div className="admin-variant-section-head">
        <div>
          <h3 className="admin-form-section-title">Colors &amp; sizes</h3>
          <p className="admin-form-hint">
            One block per color (e.g. Black, White). Pick which sizes exist for that color, set stock in the grid, one photo per color.
          </p>
        </div>
        <div className="admin-variant-section-actions">
          <button type="button" className="secondary-button" onClick={onAutoGenerateSkus} disabled={!productName?.trim()}>
            Auto-generate SKUs
          </button>
          <button type="button" className="secondary-button admin-variant-add" onClick={onAddColor}>
            + Add color
          </button>
        </div>
      </div>

      <div className="admin-color-matrix-list">
        {colorGroups.map((group, colorIndex) => (
          <article key={group.clientKey} className="admin-color-group">
            <div className="admin-variant-card-head">
              <strong>Color {colorIndex + 1}</strong>
              {colorGroups.length > 1 ? (
                <button type="button" className="admin-variant-remove" onClick={() => onRemoveColor(group.clientKey)}>
                  Remove color
                </button>
              ) : null}
            </div>

            <div className="admin-color-group-top">
              <label className="admin-color-name-field">
                Color name
                <input
                  value={group.color}
                  onChange={(e) => onChangeGroup(group.clientKey, { color: e.target.value })}
                  placeholder="Black"
                  required
                />
              </label>

              <label className="admin-file-field admin-variant-image-field">
                <span className="admin-file-label-text">Photo for this color</span>
                <input
                  className="admin-input-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  onChange={(e) => onChangeGroup(group.clientKey, { imageFile: e.target.files?.[0] || null })}
                />
              </label>

              <ColorImagePreview
                file={group.imageFile}
                savedUrl={!group.imageFile ? group.existingImage?.url : null}
                label={group.imageFile ? "New" : "Saved"}
                emptyMessage="Upload how this color looks (used for all its sizes)."
              />
            </div>

            <fieldset className="admin-size-picker">
              <legend>Sizes for {group.color || "this color"}</legend>
              <div className="admin-size-chips">
                {VARIANT_SIZES.map((size) => {
                  const on = (group.enabledSizes || []).includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`admin-size-chip${on ? " admin-size-chip--on" : ""}`}
                      aria-pressed={on}
                      onClick={() => onChangeGroup(group.clientKey, toggleColorSize(group, size))}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="admin-color-bulk-stock">
              <label>
                Set all sizes to
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  onBlur={(e) => {
                    if (e.target.value === "") return;
                    onChangeGroup(group.clientKey, applyStockToAllSizes(group, e.target.value));
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="admin-form-hint">Tab out to apply the same stock to every size above.</span>
            </div>

            <div className="admin-stock-grid-wrap">
              <table className="admin-stock-grid">
                <caption className="sr-only">Stock for {group.color || `color ${colorIndex + 1}`}</caption>
                <thead>
                  <tr>
                    <th scope="col">Size</th>
                    <th scope="col">Stock</th>
                    <th scope="col">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {sortSizesForGroup(group.enabledSizes).map((size) => (
                    <tr key={size}>
                      <th scope="row">{size}</th>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={group.stockBySize?.[size] ?? 0}
                          onChange={(e) =>
                            onChangeGroup(group.clientKey, {
                              stockBySize: {
                                ...(group.stockBySize || {}),
                                [size]: e.target.value,
                              },
                            })
                          }
                          aria-label={`${group.color || "Color"} ${size} stock`}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={group.skuBySize?.[size] ?? ""}
                          onChange={(e) =>
                            onChangeGroup(group.clientKey, {
                              skuBySize: {
                                ...(group.skuBySize || {}),
                                [size]: e.target.value.toUpperCase(),
                              },
                            })
                          }
                          placeholder="TW-TEE-…"
                          aria-label={`${group.color || "Color"} ${size} SKU`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>

      {allEnabledSizes.length > 1 ? (
        <p className="admin-form-hint admin-color-matrix-summary">
          {colorGroups.length} color{colorGroups.length === 1 ? "" : "s"} ·{" "}
          {colorGroups.reduce((n, g) => n + (g.enabledSizes?.length || 0), 0)} sellable combinations
        </p>
      ) : null}
    </div>
  );
}

function sortSizesForGroup(sizes) {
  return [...(sizes || [])].sort((a, b) => VARIANT_SIZES.indexOf(a) - VARIANT_SIZES.indexOf(b));
}
