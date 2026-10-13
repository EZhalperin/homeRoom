import styles from "./Skeleton.module.css";

export default function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style = {},
  ...rest
}) {
  const inlineStyle = {
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
    ...style,
  };

  const variantClass = styles[variant] || styles.rectangular;

  return (
    <div
      aria-hidden="true"
      className={`${styles.skeleton} ${variantClass} ${className}`}
      style={inlineStyle}
      {...rest}
    />
  );
}
