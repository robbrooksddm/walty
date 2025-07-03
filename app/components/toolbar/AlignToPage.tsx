// app/components/toolbar/icons/AlignToPage.tsx
import { forwardRef } from "react";
import type { SVGProps } from "react";

/* Stroke colour comes from currentColor so Tailwind `stroke-[--walty-teal]` still works. */
function SvgBase(
  props: SVGProps<SVGSVGElement>,
  ref: React.Ref<SVGSVGElement>,
  path: React.ReactNode
) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {path}
    </svg>
  );
}

/* ⬇️ vertical: picture is centred top–bottom inside a page outline */
export const AlignToPageVertical = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) =>
    SvgBase(
      props,
      ref,
      <>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <rect x="9" y="7" width="6" height="10" rx="1" />
      </>
    )
);

/* ⬇️ horizontal: picture is centred left–right */
export const AlignToPageHorizontal = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) =>
    SvgBase(
      props,
      ref,
      <>
        <rect x="3" y="3" width="18" height="18" rx="2.5" />
        <rect x="7" y="9" width="10" height="6" rx="1" />
      </>
    )
);