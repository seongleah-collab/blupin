import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_SANS} from '../theme';

export const TitleIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const line1 = spring({frame: frame - 12, fps, config: {damping: 200}, durationInFrames: 24});
  const line2 = spring({frame: frame - 26, fps, config: {damping: 200}, durationInFrames: 24});
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: FONT_SANS,
        opacity: out,
      }}
    >
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: COLORS.ink,
            opacity: line1,
            transform: `translateY(${(1 - line1) * 40}px)`,
          }}
        >
          Introducing the Ploid API
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: COLORS.greenDark,
            marginTop: 18,
            opacity: line2,
            transform: `translateY(${(1 - line2) * 40}px)`,
          }}
        >
          every person on earth, one key away
        </div>
      </div>
    </AbsoluteFill>
  );
};
