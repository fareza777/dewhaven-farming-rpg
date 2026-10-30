import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Opening} from './scenes/Opening';
import {Secret} from './scenes/Secret';
import {Grow} from './scenes/Grow';
import {Towns} from './scenes/Towns';
import {Quiet} from './scenes/Quiet';
import {Companions} from './scenes/Companions';
import {Paths} from './scenes/Paths';
import {Discovery} from './scenes/Discovery';
import {Home} from './scenes/Home';
import {EndCard} from './scenes/EndCard';

export const Campaign: React.FC = () => {
  const {fps}=useVideoConfig();const f=useCurrentFrame();
  return <AbsoluteFill>
    <Audio name="Original Dewhaven trailer score and foley" src={staticFile('audio/dewhaven-trailer-master.wav')} premountFor={fps}/>
    <Sequence name="01 — The inheritance / hook" durationInFrames={3*fps} premountFor={fps}><Opening/></Sequence>
    <Sequence name="02 — The secret / pattern change" from={3*fps} durationInFrames={2*fps} premountFor={fps}><Secret/></Sequence>
    <Sequence name="03 — Grow a life" from={5*fps} durationInFrames={3.5*fps} premountFor={fps}><Grow/></Sequence>
    <Sequence name="04 — Four towns" from={8.5*fps} durationInFrames={3.5*fps} premountFor={fps}><Towns/></Sequence>
    <Sequence name="05 — Quiet at the lake" from={12*fps} durationInFrames={3*fps} premountFor={fps}><Quiet/></Sequence>
    <Sequence name="06 — A home for small friends" from={15*fps} durationInFrames={3*fps} premountFor={fps}><Companions/></Sequence>
    <Sequence name="07 — Woodland paths" from={18*fps} durationInFrames={3*fps} premountFor={fps}><Paths/></Sequence>
    <Sequence name="08 — Discover the vault" from={21*fps} durationInFrames={3*fps} premountFor={fps}><Discovery/></Sequence>
    <Sequence name="09 — Homecoming" from={24*fps} durationInFrames={3*fps} premountFor={fps}><Home/></Sequence>
    <Sequence name="10 — Dewhaven end card" from={27*fps} durationInFrames={3*fps} premountFor={fps}><EndCard/></Sequence>
    <AbsoluteFill style={{backgroundColor:'#09221f',opacity:interpolate(f,[29.6*fps,30*fps],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),pointerEvents:'none'}}/>
  </AbsoluteFill>;
};
