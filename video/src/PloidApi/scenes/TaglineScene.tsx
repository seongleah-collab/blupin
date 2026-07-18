import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_SERIF} from '../theme';

// Full-bleed orange beat: "one search is all you need."
export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const textIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});
  const sweep = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - (1 - sweep) ** 3;

  return (
    <AbsoluteFill style={{background: COLORS.orange, justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontWeight: 700,
          fontSize: 108,
          letterSpacing: '-0.02em',
          color: COLORS.paper,
          opacity: textIn,
          transform: `translateY(${(1 - textIn) * 40}px)`,
          textAlign: 'center',
        }}
      >
        <span style={{position: 'relative', display: 'inline-block', fontStyle: 'italic'}}>
          one search
          <span
            style={{
              position: 'absolute',
              left: 0,
              bottom: -18,
              height: 10,
              width: `${eased * 100}%`,
              background: COLORS.ink,
              borderRadius: 5,
            }}
          />
        </span>{' '}
        is all you need.
      </div>
    </AbsoluteFill>
  );
};
