import logoImage from "@/assets/logo.svg";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AponttLogo({ width = 180, height = 60, className = "" }: LogoProps) {
  return (
    <img 
      src={logoImage}
      alt="GRUPO APONTT"
      width={width} 
      height={height}
      className={`object-contain ${className}`}
      style={{ maxWidth: width, maxHeight: height }}
    />
  );
}

export function SimpleAponttLogo({ width = 120, height = 40, className = "" }: LogoProps) {
  return (
    <img 
      src={logoImage}
      alt="GRUPO APONTT"
      width={width} 
      height={height}
      className={`object-contain ${className}`}
      style={{ maxWidth: width, maxHeight: height }}
    />
  );
}