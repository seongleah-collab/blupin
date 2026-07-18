import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

const ROWS: Array<{label: string; parts: Array<{t: string; hot?: boolean}>}> = [
  {label: 'PROFILE', parts: [{t: 'Maya Chen · NYC · '}, {t: 'verified live', hot: true}]},
  {label: 'ROLE', parts: [{t: 'Head of Growth @ Driftline · '}, {t: 'started 3 wks ago', hot: true}]},
  {label: 'SIGNALS', parts: [{t: 'hiring 4 growth roles · '}, {t: 'posting weekly', hot: true}]},
  {label: 'EMAIL', parts: [{t: 'maya@driftline.io · '}, {t: 'deliverable ✓', hot: true}]},
  {label: 'PHONE', parts: [{t: '+1 (917) ··· ···· · '}, {t: 'reveal on demand', hot: true}]},
];

const START = 8;
const EVERY = 24;

// Everything ploid knows, as an editorial ledger.
export const EnrichScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const visible = ROWS.filter((_, i) => frame >= START + i * EVERY).length;
  const drift = spring({
    frame: frame - (START + 2.4 * EVERY),
    fps,
    config: {damping: 200},
    durationInFrames: EVERY * 2.6,
  });

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 1560, transform: `translateY(${drift * -60}px)`}}>
        {ROWS.slice(0, visible).map((row, i) => {
          const rowStart = START + i * EVERY;
          const on = spring({frame: frame - rowStart, fps, config: {damping: 200}, durationInFrames: 16});
          const isNewest = i === visible - 1;
          const age = interpolate(frame, [rowStart + EVERY, rowStart + EVERY * 2.8], [1, 0.4], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 44,
                padding: '26px 0',
                borderBottom: '2px solid rgba(25, 20, 16, 0.08)',
                opacity: on * (isNewest ? 1 : age),
                transform: `translateY(${(1 - on) * 34}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 24,
                  letterSpacing: '0.2em',
                  color: isNewest ? COLORS.orangeDeep : COLORS.inkSoft,
                  fontWeight: isNewest ? 700 : 500,
                  width: 220,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {row.label}
              </div>
              <div style={{fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 52, color: COLORS.ink}}>
                {row.parts.map((p, j) => (
                  <span key={j} style={p.hot ? {fontStyle: 'italic', color: COLORS.orangeDeep} : undefined}>
                    {p.t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
