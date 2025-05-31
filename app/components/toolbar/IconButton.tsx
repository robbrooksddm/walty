// IconButton.tsx
"use client";
import { forwardRef } from "react";

interface IconBtnProps {
  Icon:  React.ElementType;
  label: string;           // full tooltip / aria label
  caption?: string;        // 1-2-word text under the icon (defaults to first word of label)
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

/**
 * Toolbar icon button — 48 px square hit-area with 24 px icon
 * and 11 px caption text. Forward-refs the underlying button so
 * popovers can anchor to it.
 */
const IconButton = forwardRef<HTMLButtonElement, IconBtnProps>(
  (
    { Icon, label, caption = label.split(" ")[0], onClick, active, disabled },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center w-12 p-2 gap-0.5
                  rounded focus:outline-none
                  focus:ring-2 focus:ring-[--walty-orange] focus:ring-offset-1
                  hover:bg-[--walty-orange]/10 disabled:opacity-40
                  ${active ? "bg-[--walty-orange]/10" : ""}`}
    >
      {/* icon */}
      <Icon
        className={`w-6 h-6 stroke-[--walty-teal] transition-colors
                    ${active ? "stroke-[--walty-orange]"
                              : "hover:stroke-[--walty-orange]"}`}
      />
      {/* caption */}
      <span
        className={`text-[11px] leading-none font-medium tracking-wide
                    ${active ? "text-[--walty-orange]"
                              : "text-[--walty-teal]"}`}
      >
        {caption}
      </span>
    </button>
  )
);
IconButton.displayName = "IconButton";

export default IconButton;