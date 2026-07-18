import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {DotGrid} from './DotGrid';
import {COLORS} from './theme';
import {DarkApiScene} from './scenes/DarkApiScene';
import {NameCloseup} from './scenes/NameCloseup';
import {Outro} from './scenes/Outro';
import {PricingScene} from './scenes/PricingScene';
import {PromptScene} from './scenes/PromptScene';
import {TableReveal, TablePayoff} from './scenes/TableScenes';
import {TaglineScene} from './scenes/TaglineScene';
import {TitleIntro} from './scenes/TitleIntro';

// Scene lengths in frames @ 30fps.
const SCENES: Array<{Comp: React.FC; frames: number; dark?: boolean; grid?: boolean}> = [
  {Comp: TitleIntro, frames: 110},
  {Comp: PromptScene, frames: 130},
  {Comp: TableReveal, frames: 105, grid: true},
  {Comp: NameCloseup, frames: 55, grid: true},
  {Comp: DarkApiScene, frames: 240, dark: true},
  {Comp: TablePayoff, frames: 175, grid: true},
  {Comp: PricingScene, frames: 135, grid: true},
  {Comp: TaglineScene, frames: 85, grid: true},
  {Comp: Outro, frames: 110},
];

export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);

export const PloidApiLaunch: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{background: COLORS.cream}}>
      {SCENES.map(({Comp, frames, dark, grid}, i) => {
        const from = cursor;
        cursor += frames;
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <AbsoluteFill style={{background: dark ? COLORS.dark : COLORS.cream}}>
              {grid && !dark ? <DotGrid /> : null}
              <Comp />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
