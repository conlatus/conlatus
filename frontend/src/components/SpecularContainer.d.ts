import { ReactNode } from "react";

export interface SpecularContainerProps {
  children?: ReactNode;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  lineColor?: string;
  baseColor?: string;
  intensity?: number;
  shineSize?: number;
  shineFade?: number;
  thickness?: number;
  speed?: number;
  followMouse?: boolean;
  proximity?: number;
  autoAnimate?: boolean;
  className?: string;
  contentClassName?: string;
}

declare const SpecularContainer: React.FC<SpecularContainerProps>;

export default SpecularContainer;
