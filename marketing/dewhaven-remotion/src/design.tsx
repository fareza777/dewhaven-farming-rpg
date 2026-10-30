import React from 'react';
import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';

const fontsReady = delayRender('Load bundled Dewhaven typography');
Promise.all([
  loadFont({family: 'Dewhaven Display', url: staticFile('fonts/fraunces.woff2'), weight: '400'}),
  loadFont({family: 'Dewhaven Sans', url: staticFile('fonts/nunito-regular.woff2'), weight: '400'}),
  loadFont({family: 'Dewhaven Sans', url: staticFile('fonts/nunito-bold.woff2'), weight: '700'}),
]).then(() => continueRender(fontsReady));

export const C = {pine: '#102f2c', deep: '#09221f', ivory: '#f7eedb', gold: '#dcba7a', mist: '#b8cdc0', ink: '#253b33'};
export const display = 'Dewhaven Display, Georgia, serif';
export const sans = 'Dewhaven Sans, Arial, sans-serif';

export const KeyMark: React.FC<{size?: number; color?: string}> = ({size = 62, color = C.gold}) => (
  <svg width={size} height={size * .42} viewBox="0 0 100 42" fill="none" aria-hidden>
    <path d="M29 21a12 12 0 1 0-24 0 12 12 0 0 0 24 0ZM30 21h62m-12 0v12m10-12v9" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    <path d="M16 14v14M9 21h14" stroke={color} strokeWidth="1.2" opacity=".5"/>
  </svg>
);

export const SmallCaps: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => (
  <div style={{fontFamily: sans, fontSize: 23, fontWeight: 700, letterSpacing: 5, color: C.gold, lineHeight: 1.2, ...style}}>{children}</div>
);
