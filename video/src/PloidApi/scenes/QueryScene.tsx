import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {blink, typed} from '../helpers';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

export const QUERY = 'heads of growth at seed-stage fintechs in nyc';

// The ask, typed as big editorial serif over a growing rule — no chat chrome.
export const QueryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const kickerIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 16});
  const typeStart = 14;
  const typeDur = 74;
  const text = typed(frame, QUERY, typeStart, typeDur);
  const done = frame >= typeStart + typeDur;
  const rule = interpolate(frame, [typeStart, typeStart + typeDur + 6], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: out}}>
      <div style={{width: 1560}}>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 26,
            letterSpacing: '0.22em',
            color: COLORS.orangeDeep,
            marginBottom: 42,
            opacity: kickerIn,
          }}
        >
          PLOID · PEOPLE SEARCH
        </div>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontWeight: 600,
            fontSize: 86,
            lineHeight: 1.22,
            letterSpacing: '-0.015em',
            color: COLORS.ink,
            minHeight: 220,
          }}
        >
          {text}
          {(!done || blink(frame)) && frame >= typeStart ? (
            <span
              style={{
                display: 'inline-block',
                width: 14,
                height: 74,
                background: COLORS.orange,
                marginLeft: 10,
                verticalAlign: 'baseline',
                transform: 'translateY(8px)',
              }}
            />
          ) : null}
        </div>
        <div style={{height: 6, background: 'rgba(25, 20, 16, 0.12)', marginTop: 34}}>
          <div style={{height: 6, width: `${rule}%`, background: COLORS.orange}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
