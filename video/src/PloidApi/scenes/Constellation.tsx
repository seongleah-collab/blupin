import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

export type ChipPerson = {
  name: string;
  initials: string;
  role: string;
  company: string;
  match: boolean;
  x: number;
  y: number;
};

export const CHIP_PEOPLE: ChipPerson[] = [
  {name: 'maya chen', initials: 'MC', role: 'Head of Growth', company: 'Driftline', match: true, x: 560, y: 300},
  {name: 'jordan okafor', initials: 'JO', role: 'Growth Lead', company: 'Corely', match: false, x: 1230, y: 235},
  {name: 'sam petit', initials: 'SP', role: '—', company: '—', match: false, x: 320, y: 640},
  {name: 'ana reyes', initials: 'AR', role: 'VP Growth', company: 'Brightpath', match: true, x: 1480, y: 555},
  {name: 'tom moss', initials: 'TM', role: 'Marketing', company: 'Studio Fern', match: false, x: 880, y: 770},
  {name: 'lena vogel', initials: 'LV', role: 'Head of Growth', company: 'Nordvia', match: true, x: 1080, y: 460},
  {name: 'dev anand', initials: 'DA', role: 'Growth', company: 'Parcelbee', match: false, x: 470, y: 470},
  {name: 'fin harper', initials: 'FH', role: 'Growth Ops', company: 'Lumenor', match: false, x: 1530, y: 830},
];

const LINKS: Array<[number, number]> = [
  [0, 6], [0, 5], [1, 5], [3, 5], [2, 4], [4, 7], [1, 3], [6, 2], [0, 4], [5, 7],
];

export const Chip: React.FC<{p: ChipPerson; state: number; scale?: number}> = ({p, state, scale = 1}) => (
  // state: 0 = normal, 1 = matched/lit, negative = dimmed amount
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16 * scale,
      background: COLORS.paperCard,
      border: `${3 * scale}px solid ${state > 0 ? COLORS.orange : 'rgba(25, 20, 16, 0.10)'}`,
      borderRadius: 999,
      padding: `${10 * scale}px ${26 * scale}px ${10 * scale}px ${12 * scale}px`,
      boxShadow:
        state > 0
          ? `0 ${14 * scale}px ${44 * scale}px rgba(255, 107, 26, ${0.28 * state})`
          : `0 ${10 * scale}px ${30 * scale}px rgba(40, 30, 20, 0.10)`,
    }}
  >
    <div
      style={{
        width: 62 * scale,
        height: 62 * scale,
        borderRadius: '50%',
        background: state > 0 ? COLORS.orange : COLORS.orangeWash,
        color: state > 0 ? COLORS.paper : COLORS.orangeDeep,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_SANS,
        fontWeight: 700,
        fontSize: 24 * scale,
        flexShrink: 0,
      }}
    >
      {p.initials}
    </div>
    <div style={{fontFamily: FONT_SANS, fontSize: 30 * scale, fontWeight: 600, color: COLORS.ink, whiteSpace: 'nowrap'}}>
      {p.name}
    </div>
  </div>
);

const POP_START = 4;
const POP_STAGGER = 5;
const LINES_AT = 34;
const FILTER_AT = 92;
const PILL_AT = 128;

// Search results as a network of people, matches lighting up orange.
export const Constellation: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const zoom = interpolate(frame, [0, 180], [1.06, 1]);
  const pillIn = spring({frame: frame - PILL_AT, fps, config: {damping: 200}, durationInFrames: 18});

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {LINKS.map(([a, b], i) => {
            const pa = CHIP_PEOPLE[a];
            const pb = CHIP_PEOPLE[b];
            const on = interpolate(frame, [LINES_AT + i * 3, LINES_AT + i * 3 + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const isMatchLink = pa.match && pb.match;
            const dimmed = interpolate(frame, [FILTER_AT, FILTER_AT + 16], [1, isMatchLink ? 1 : 0.25], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <line
                key={i}
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke={isMatchLink && frame > FILTER_AT ? COLORS.orange : 'rgba(25, 20, 16, 0.18)'}
                strokeWidth={isMatchLink && frame > FILTER_AT ? 3.5 : 2}
                strokeDasharray="1 0"
                opacity={on * dimmed}
              />
            );
          })}
        </svg>
        {CHIP_PEOPLE.map((p, i) => {
          const pop = spring({
            frame: frame - POP_START - i * POP_STAGGER,
            fps,
            config: {damping: 15, stiffness: 180},
            durationInFrames: 24,
          });
          const lit = p.match
            ? interpolate(frame, [FILTER_AT + i * 2, FILTER_AT + i * 2 + 12], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0;
          const dim = p.match
            ? 1
            : interpolate(frame, [FILTER_AT, FILTER_AT + 16], [1, 0.3], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
          return (
            <div
              key={p.name}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                transform: `translate(-50%, -50%) scale(${Math.min(1, pop) * (1 + lit * 0.09)})`,
                opacity: Math.min(1, pop * 1.3) * dim,
              }}
            >
              <Chip p={p} state={lit} />
            </div>
          );
        })}
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - pillIn) * 30}px)`,
          opacity: pillIn,
          background: COLORS.ink,
          color: COLORS.paper,
          borderRadius: 999,
          padding: '16px 38px',
          fontFamily: FONT_MONO,
          fontSize: 27,
          letterSpacing: '0.06em',
        }}
      >
        3 matches · <span style={{color: COLORS.orange}}>verified live</span>
      </div>
    </AbsoluteFill>
  );
};
