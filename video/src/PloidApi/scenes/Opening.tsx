import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_SERIF} from '../theme';

const WORDS = ['who', 'are', 'you', 'looking', 'for?'];

// Full-bleed orange cold open, words landing one by one.
export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const out = interpolate(frame, [durationInFrames - 10, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.orange,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: out,
      }}
    >
      <div
        style={{
          fontFamily: FONT_SERIF,
          fontWeight: 700,
          fontSize: 150,
          letterSpacing: '-0.02em',
          color: COLORS.paper,
          display: 'flex',
          gap: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 1500,
        }}
      >
        {WORDS.map((w, i) => {
          const s = spring({
            frame: frame - 8 - i * 9,
            fps,
            config: {damping: 16, stiffness: 160},
            durationInFrames: 26,
          });
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: Math.min(1, s * 1.4),
                transform: `translateY(${(1 - s) * 90}px) rotate(${(1 - s) * (i % 2 === 0 ? -4 : 4)}deg)`,
                fontStyle: i === WORDS.length - 1 ? 'italic' : 'normal',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
