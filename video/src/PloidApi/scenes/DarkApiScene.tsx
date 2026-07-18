import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DotGrid} from '../DotGrid';
import {blink, typed} from '../helpers';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

const CURL_LINES = [
  '$ curl api.ploid.com/v1/people/search \\',
  '    -H "x-api-key: pld_live_9f3kQ...w2" \\',
  `    -d '{"q": "heads of growth, seed fintech, nyc"}'`,
];

const TYPE_START = 8;
const TYPE_DUR = 66;
const COUNT_START = TYPE_START + TYPE_DUR + 14; // 88
const COUNT_DUR = 52;
const ENRICH_START = COUNT_START + COUNT_DUR + 10; // 150

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

  const curlText = typed(frame, CURL_LINES.join('\n'), TYPE_START, TYPE_DUR);
  const curlDone = frame >= TYPE_START + TYPE_DUR;

  // Curl block fades and slides up once the search kicks off.
  const curlOut = interpolate(frame, [COUNT_START - 6, COUNT_START + 6], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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

      {curlOut > 0 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: curlOut}}>
          <pre
            style={{
              fontFamily: FONT_MONO,
              fontSize: 40,
              lineHeight: 1.75,
              color: COLORS.darkText,
              margin: 0,
            }}
          >
            {curlText}
            {!curlDone || blink(frame) ? (
              <span
                style={{
                  display: 'inline-block',
                  width: 22,
                  height: 44,
                  background: COLORS.greenBright,
                  verticalAlign: 'middle',
                  marginLeft: 4,
                }}
              />
            ) : null}
          </pre>
        </AbsoluteFill>
      ) : null}

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
