import vantageLogo from "@/assets/vantage.svg"

export default function Logo({ size = 24, alt = "Vantage logo", style, className }) {
  return (
    <img
      src={vantageLogo}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{ width: size, height: size, display: "block", ...style }}
    />
  )
}
