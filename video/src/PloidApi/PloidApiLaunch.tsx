import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {COLORS} from './theme';
import {Constellation} from './scenes/Constellation';
import {EnrichScene} from './scenes/EnrichScene';
import {Opening} from './scenes/Opening';
import {Outro} from './scenes/Outro';
import {PayoffScene} from './scenes/PayoffScene';
import {PricingList} from './scenes/PricingList';
import {ProfileScene} from './scenes/ProfileScene';
import {QueryScene} from './scenes/QueryScene';
import {SearchCount} from './scenes/SearchCount';
import {TaglineScene} from './scenes/TaglineScene';

// Scene lengths in frames @ 30fps.
const SCENES: Array<{Comp: React.FC; frames: number}> = [
  {Comp: Opening, frames: 100},
  {Comp: QueryScene, frames: 120},
  {Comp: SearchCount, frames: 85},
  {Comp: Constellation, frames: 175},
  {Comp: ProfileScene, frames: 85},
  {Comp: EnrichScene, frames: 145},
  {Comp: PayoffScene, frames: 105},
  {Comp: PricingList, frames: 130},
  {Comp: TaglineScene, frames: 80},
  {Comp: Outro, frames: 100},
];

export const TOTAL_FRAMES = SCENES.reduce((sum, s) => sum + s.frames, 0);

export const PloidApiLaunch: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{background: COLORS.paper}}>
      {SCENES.map(({Comp, frames}, i) => {
        const from = cursor;
        cursor += frames;
        return (
          <Sequence key={i} from={from} durationInFrames={frames}>
            <AbsoluteFill style={{background: COLORS.paper}}>
              <Comp />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
