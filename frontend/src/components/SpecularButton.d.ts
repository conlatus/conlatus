import { ReactNode, MouseEventHandler, ButtonHTMLAttributes } from "react";

export interface SpecularButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  size?: "sm" | "md" | "lg" | string;
  radius?: number;
  tint?: string;
  tintOpacity?: number;
  blur?: number;
  textColor?: string;
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
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  type?: "button" | "submit" | "reset";
}

declare const SpecularButton: React.FC<SpecularButtonProps>;

export default SpecularButton;
