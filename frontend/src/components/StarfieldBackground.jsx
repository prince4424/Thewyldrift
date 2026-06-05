import React from "react";

/**
 * Fixed glitter star layers for .store-genzy pages (decorative, no pointer events).
 */
export default function StarfieldBackground() {
  return (
    <div className="store-starfield" aria-hidden="true">
      <div className="store-starfield__layer store-starfield__layer--far" />
      <div className="store-starfield__layer store-starfield__layer--mid" />
      <div className="store-starfield__layer store-starfield__layer--near" />
      <div className="store-starfield__glitter" />
    </div>
  );
}
