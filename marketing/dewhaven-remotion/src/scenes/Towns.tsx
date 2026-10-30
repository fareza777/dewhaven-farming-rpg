import React from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {GameScene} from './GameScene';
export const Towns: React.FC = () => {
  const {fps} = useVideoConfig();
  return <>
    <Sequence name="Dewhaven village" durationInFrames={2 * fps} premountFor={fps}><GameScene clip="02-village" eyebrow="A VALLEY FULL OF EVERYDAY MAGIC" headline={'Four towns.\nMany stories.'} note="Meet the neighbours. Find your place." index="04"/></Sequence>
    <Sequence name="Sunridge town" from={2 * fps} durationInFrames={1.5 * fps} premountFor={fps}><GameScene clip="05-sunridge" eyebrow="A VALLEY FULL OF EVERYDAY MAGIC" headline={'Four towns.\nMany stories.'} note="Meet the neighbours. Find your place." index="04"/></Sequence>
  </>;
};
