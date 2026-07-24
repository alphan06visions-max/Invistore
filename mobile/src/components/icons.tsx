import React from 'react';
import Svg, { Path, G, Circle, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string; fill?: string; style?: any };

export function Heart({ size = 24, color = '#fff', fill = 'none', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Svg>
  );
}

export function MessageCircle({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

export function Send({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M22 2L11 13" />
      <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  );
}

export function Bookmark({ size = 24, color = '#fff', fill = 'none', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

export function Home({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  );
}

export function Search({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Circle cx={11} cy={11} r={8} />
      <Path d="M21 21l-4.35-4.35" />
    </Svg>
  );
}

export function PlusSquare({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M3 3h18v18H3zM12 8v8M8 12h8" />
    </Svg>
  );
}

export function Compass({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </Svg>
  );
}

export function User({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export function MoreHorizontal({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Circle cx={12} cy={12} r={1} fill={color} />
      <Circle cx={19} cy={12} r={1} fill={color} />
      <Circle cx={5} cy={12} r={1} fill={color} />
    </Svg>
  );
}

export function ChevronLeft({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

export function X({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export function Check({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export function CheckCheck({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M18 6l-8 8-4-4M22 6l-8 8" />
    </Svg>
  );
}

export function Phone({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

export function Video({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M23 7l-7 5 7 5V7z" />
      <Rect x={1} y={5} width={15} height={14} rx={2} ry={2} />
    </Svg>
  );
}


export function PhoneOff({ size = 24, color = '#fff', style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.73.28 1.49.5 2.27.63" />
      <Path d="M16.5 4.5c2.16.93 3.97 2.46 5.3 4.3" />
      <Path d="M2.18 1L1 2.18l21.82 21.82L24 22.82" />
      <Path d="M4.5 3.5c-.5.8-.88 1.66-1.13 2.56" />
    </Svg>
  );
}

export function Mic({ size=24, color='#fff', style }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}><Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><Path d="M19 10v2a7 7 0 0 1-14 0v-2"/><Path d="M12 19v4"/><Path d="M8 23h8"/></Svg>;
}
export function MicOff({ size=24, color='#fff', style }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}><Path d="M1 1l22 22"/><Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><Path d="M17 16.95A7 7 0 0 1 5 12v-2"/></Svg>;
}
export function VideoOff({ size=24, color='#fff', style }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}><Path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v4.34l1 1L23 7v10"/><Path d="M1 1l22 22"/></Svg>;
}
export function CameraSwitch({ size=24, color='#fff', style }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}><Path d="M1 17V7a2 2 0 0 1 2-2h4l2-2h6l2 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z"/><Path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><Path d="M23 17l-4-4-4 4"/></Svg>;
}
