import React from "react";

interface ScaleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  className?: string;
}

export function ScaleIcon({
  size = 20,
  color = "#f47820",
  className = "",
  style,
  ...props
}: ScaleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      aria-hidden="true"
      {...props}
    >
      {/* Central pillar & base */}
      <path
        d="M12 3V21M7 21H17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top beam */}
      <path
        d="M3 7L12 5L21 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top fulcrum finial */}
      <circle cx="12" cy="4" r="1.5" fill={color} />

      {/* Left scale strings & pan */}
      <path
        d="M3 7L1 14H9L7 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 14C1 16.2 2.8 17.5 5 17.5C7.2 17.5 9 16.2 9 14H1Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
      />

      {/* Right scale strings & pan */}
      <path
        d="M21 7L15 14H23L21 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 14C15 16.2 16.8 17.5 19 17.5C21.2 17.5 23 16.2 23 14H15Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
      />
    </svg>
  );
}
