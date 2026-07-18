import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

const COUNT_START = 6;
const COUNT_DUR = 58;

// Giant editorial counter — the scale of the index, no terminal theatrics.
export const SearchCount: React.FC = () => {
  const frame = useCurrentFrame();

  const count = Math.round(
    interpolate(frame, [COUNT_START, COUNT_START + COUNT_DUR], [0, 2_000_000_000], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 4,
    }),
  );
  const bar = interpolate(frame, [COUNT_START, COUNT_START + COUNT_DUR], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 1560}}>
        <div style={{fontFamily: FONT_MONO, fontSize: 26, letterSpacing: '0.22em', color: COLORS.orangeDeep}}>
          SEARCHING
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            fontSize: 170,
            letterSpacing: '-0.02em',
            color: COLORS.ink,
            marginTop: 16,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count.toLocaleString('en-US')}
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 54,
            color: COLORS.inkSoft,
            marginTop: 6,
          }}
        >
          people, verified live
        </div>
        <div style={{height: 6, background: 'rgba(25, 20, 16, 0.12)', marginTop: 44}}>
          <div style={{height: 6, width: `${bar}%`, background: COLORS.orange}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
