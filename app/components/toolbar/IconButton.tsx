// app/components/toolbar/IconButton.tsx
"use client";

import { forwardRef } from "react";

interface Props {
  Icon: React.ElementType;   // lucide-react icon or custom SVG
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

/** generic 44 × 44px icon button – forwards its ref */
const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { Icon, label, onClick, active, disabled }: Props,
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded focus:outline-none focus:ring-2 focus:ring-[--walty-orange] focus:ring-offset-1
                  hover:bg-[--walty-orange]/10 disabled:opacity-40
                  ${active ? "bg-[--walty-orange]/10" : ""}`}
    >
      <Icon
        className={`w-6 h-6 stroke-[--walty-teal] transition-colors
                    ${active ? "stroke-[--walty-orange]"
                              : "hover:stroke-[--walty-orange]"}`}
      />
    </button>
  );
});

/* at bottom */
export default forwardRef(IconButton) as
  React.ForwardRefExoticComponent<
    Pick<Props, Exclude<keyof Props, "ref">> &
    React.RefAttributes<HTMLButtonElement>
  >;