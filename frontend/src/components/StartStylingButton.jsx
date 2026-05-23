import React from "react";
import { makeStartStylingUrl } from "../lib/storefront.js";

export default function StartStylingButton({
  href,
  fullWidth = false,
  className = "",
  children = "Start Styling →",
  onClick,
  disabled = false,
  ...rest
}) {
  const url = href || makeStartStylingUrl();
  const cls = [
    "btn-style-primary",
    fullWidth ? "btn-style-primary--full" : "",
    disabled ? "btn-style-primary--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (disabled) {
    return (
      <span className={cls} aria-disabled="true" {...rest}>
        {children}
      </span>
    );
  }

  return (
    <a
      className={cls}
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      {...rest}
    >
      {children}
    </a>
  );
}
