import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO} from '../theme';

// Tight close-up on one result before the API dive, mono with a green block cursor.
export const NameCloseup: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const text = 'maya chen · head of growth';
  const cursorPos = Math.round(
    interpolate(frame, [0, durationInFrames - 10], [3, text.length - 4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: FONT_MONO, fontSize: 88, color: COLORS.ink, position: 'relative', whiteSpace: 'pre'}}>
        {text.slice(0, cursorPos)}
        <span
          style={{
            background: COLORS.green,
            borderRadius: 6,
            padding: '10px 2px',
            margin: '-10px -2px',
          }}
        >
          {text[cursorPos]}
        </span>
        {text.slice(cursorPos + 1)}
      </div>
    </AbsoluteFill>
  );
};
