import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DotGrid} from '../DotGrid';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

const COUNT_START = 10;
const COUNT_DUR = 52;
const ENRICH_START = COUNT_START + COUNT_DUR + 10; // 72

const ENRICH_ROWS: Array<{label: string; parts: Array<{t: string; green?: boolean}>}> = [
  {label: 'PROFILE', parts: [{t: 'Maya Chen · NYC · '}, {t: 'verified live', green: true}]},
  {label: 'ROLE', parts: [{t: 'Head of Growth @ Driftline · '}, {t: 'started 3 wks ago', green: true}]},
  {label: 'SIGNALS', parts: [{t: 'hiring 4 growth roles · '}, {t: '↑ posting weekly', green: true}]},
  {label: 'EMAIL', parts: [{t: 'maya@driftline.io · '}, {t: 'deliverable ✓', green: true}]},
  {label: 'PHONE', parts: [{t: '+1 (917) ··· ···· · '}, {t: 'reveal on demand', green: true}]},
];

const ROW_EVERY = 16;

export const DarkApiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const count = Math.round(
    interpolate(frame, [COUNT_START, COUNT_START + COUNT_DUR], [0, 3_241_008_116], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => 1 - (1 - t) ** 4,
    }),
  );
  const countVisible = frame >= COUNT_START && frame < ENRICH_START + 4;
  const countOut = interpolate(frame, [ENRICH_START - 8, ENRICH_START + 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barW = interpolate(frame, [COUNT_START, COUNT_START + COUNT_DUR], [0, 620], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const visibleRows = ENRICH_ROWS.filter((_, i) => frame >= ENRICH_START + i * ROW_EVERY).length;
  // Stack drifts up as rows accumulate so the newest row stays near center.
  const drift = spring({
    frame: frame - (ENRICH_START + 2 * ROW_EVERY),
    fps,
    config: {damping: 200},
    durationInFrames: ROW_EVERY * 3,
  });

  return (
    <AbsoluteFill style={{background: COLORS.dark}}>
      <DotGrid dark />

      {countVisible ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: countOut}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontFamily: FONT_MONO, fontSize: 48, color: COLORS.darkText}}>
              searching <span style={{color: COLORS.greenBright}}>{count.toLocaleString('en-US')}</span> people
            </div>
            <div
              style={{
                width: 620,
                height: 3,
                background: COLORS.darkSoft,
                margin: '38px auto 0',
                position: 'relative',
              }}
            >
              <div style={{position: 'absolute', left: 0, top: 0, height: 3, width: barW, background: COLORS.darkDim}} />
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {frame >= ENRICH_START ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `translateY(${drift * -70}px)`}}>
            {ENRICH_ROWS.slice(0, visibleRows).map((row, i) => {
              const rowStart = ENRICH_START + i * ROW_EVERY;
              const on = spring({frame: frame - rowStart, fps, config: {damping: 200}, durationInFrames: 14});
              const isNewest = i === visibleRows - 1;
              const age = interpolate(frame, [rowStart + ROW_EVERY, rowStart + ROW_EVERY * 2.6], [1, 0.32], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 34,
                    marginBottom: 40,
                    opacity: on * (isNewest ? 1 : age),
                    transform: `translateY(${(1 - on) * 30}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 25,
                      letterSpacing: '0.16em',
                      color: isNewest ? COLORS.greenBright : COLORS.darkDim,
                      width: 260,
                      textAlign: 'right',
                    }}
                  >
                    {row.label}
                  </div>
                  <div style={{fontFamily: FONT_SANS, fontSize: 46, fontWeight: 600, color: COLORS.darkText}}>
                    {row.parts.map((p, j) => (
                      <span key={j} style={{color: p.green ? '#86EFAC' : undefined}}>
                        {p.t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
