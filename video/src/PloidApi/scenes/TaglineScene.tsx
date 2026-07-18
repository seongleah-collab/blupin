import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_SANS} from '../theme';

// "one key is all your agent needs." with a highlighter swipe under "one key".
export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const textIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});
  const swipe = interpolate(frame, [26, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - (1 - swipe) ** 3;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT_SANS}}>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: '-0.015em',
          color: COLORS.ink,
          opacity: textIn,
          transform: `translateY(${(1 - textIn) * 36}px)`,
        }}
      >
        <span style={{position: 'relative', whiteSpace: 'nowrap'}}>
          <span
            style={{
              position: 'absolute',
              left: -18,
              right: undefined,
              top: -10,
              bottom: -14,
              width: `calc(${eased * 100}% + ${eased * 36}px)`,
              background: COLORS.green,
              borderRadius: 12,
              zIndex: 0,
            }}
          />
          <span style={{position: 'relative', zIndex: 1}}>one key</span>
        </span>{' '}
        is all your agent needs.
      </div>
    </AbsoluteFill>
  );
};
