import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, display, KeyMark, sans, SmallCaps} from '../design';

export type GameSceneProps = {
  clip: string;
  eyebrow: string;
  headline: string;
  note?: string;
  accent?: string;
  index?: string;
  trim?: number;
};

export const GameScene: React.FC<GameSceneProps> = ({clip, eyebrow, headline, note, accent = C.gold, index = '01', trim = 0}) => {
  const frame = useCurrentFrame();
  const {width, height, fps, durationInFrames} = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill style={{backgroundColor: C.deep, fontFamily: sans, color: C.ivory, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: portrait ? 300 : 0, width, height: portrait ? 1620 : height, overflow: 'hidden'}}>
        <Video
          name={`${clip} native gameplay`}
          src={staticFile(`gameplay/${clip}-${portrait ? 'portrait' : 'landscape'}.mp4`)}
          trimBefore={trim * fps}
          muted
          objectFit="cover"
          premountFor={fps}
          style={{width: '100%', height: '100%', imageRendering: 'pixelated', scale: interpolate(frame, [0, 4 * fps], [1.025, 1], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp'})}}
        />
      </div>
      {!portrait && <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(7,29,26,.94) 0%, rgba(7,29,26,.82) 26%, rgba(7,29,26,.36) 47%, rgba(7,29,26,0) 72%), linear-gradient(0deg, rgba(7,29,26,.3), transparent 30%)'}}/>}
      {portrait && <div style={{position: 'absolute', left: 0, top: 0, width, height: 300, background: `linear-gradient(120deg, ${C.deep}, ${C.pine})`, borderBottom: `2px solid ${accent}`}}/>}
      <div style={{position: 'absolute', left: portrait ? 72 : 108, top: portrait ? 35 : 85, right: portrait ? 70 : undefined, display: 'flex', alignItems: 'center', gap: 24}}>
        <KeyMark size={portrait ? 55 : 70} color={accent}/>
        <SmallCaps style={{fontSize: portrait ? 19 : 22, letterSpacing: portrait ? 4 : 5, color: accent}}>DEWHAVEN</SmallCaps>
      </div>
      <div style={{position: 'absolute', left: portrait ? 72 : 108, top: portrait ? 95 : 280, width: portrait ? 936 : 740, opacity: interpolate(frame, [0, 8], [.15, 1], {extrapolateRight: 'clamp'}), translate: interpolate(frame, [0, 18], ['0px 24px', '0px 0px'], {extrapolateRight: 'clamp', easing: Easing.bezier(.16,1,.3,1)})}}>
        {!portrait && <SmallCaps style={{color: accent, fontSize: 21, marginBottom: 32}}>{eyebrow}</SmallCaps>}
        <div style={{fontFamily: display, fontSize: portrait ? 83 : Math.max(...headline.split('\n').map(line=>line.length))>12 ? 108 : 126, lineHeight: portrait ? 1.05 : 1.04, letterSpacing: portrait ? -2.4 : -4.3, whiteSpace: 'pre-line', textShadow: portrait ? undefined : '0 3px 24px rgba(0,0,0,.15)'}}>{headline.split('\n').map((line,i)=><div key={line} style={{color:i===1?accent:C.ivory}}>{line}</div>)}</div>
        {!portrait && note && <div style={{marginTop: 36, fontSize: 33, color: C.mist, lineHeight: 1.4, maxWidth: 660}}>{note}</div>}
      </div>
      {!portrait && <div style={{position: 'absolute', left: 108, bottom: 90, display: 'flex', alignItems: 'center', gap: 26}}>
        <span style={{fontSize: 20, letterSpacing: 4, color: accent}}>{index}</span><div style={{width: 100, height: 1, background: accent, opacity: .6}}/>
        <span style={{fontSize: 19, letterSpacing: 3, color: C.ivory, opacity: .65}}>A VALLEY TO CALL HOME</span>
      </div>}
      <div style={{position: 'absolute', top: portrait ? 0 : undefined, bottom: portrait ? undefined : 0, left: 0, height: portrait ? 3 : 4, width: interpolate(frame, [0, Math.max(durationInFrames, 120)], [0, width], {extrapolateRight: 'clamp'}), backgroundColor: accent, opacity: .7}}/>
      <AbsoluteFill style={{pointerEvents: 'none', backgroundColor: C.ivory, opacity: interpolate(frame, [0, 3, 8], [.12, .025, 0], {extrapolateRight: 'clamp'})}}/>
    </AbsoluteFill>
  );
};
