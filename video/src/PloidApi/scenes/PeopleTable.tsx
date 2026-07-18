import React from 'react';
import {interpolate} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

export type Person = {
  name: string;
  role: string;
  company: string;
  email: string;
  status: 'match' | 'not a match' | 'agency';
};

export const PEOPLE: Person[] = [
  {name: 'maya chen', role: 'Head of Growth', company: 'Driftline', email: 'maya@driftline.io', status: 'match'},
  {name: 'jordan okafor', role: 'Growth Lead', company: 'Corely', email: 'jordan@corely.com', status: 'match'},
  {name: 'sam petit', role: '—', company: '—', email: 'sam.p@outlook.com', status: 'not a match'},
  {name: 'ana reyes', role: 'VP Growth', company: 'Brightpath', email: 'ana@brightpath.ai', status: 'match'},
  {name: 'tom moss', role: 'Marketing', company: 'Studio Fern', email: 't.moss@gmail.com', status: 'agency'},
  {name: 'lena vogel', role: 'Head of Growth', company: 'Nordvia', email: 'lena@nordvia.co', status: 'match'},
  {name: 'dev anand', role: 'Growth', company: 'Parcelbee', email: 'dev@parcelbee.io', status: 'match'},
  {name: 'fin harper', role: 'Growth Ops', company: 'Lumenor', email: 'fin@lumenor.com', status: 'match'},
];

// Rows that end up highlighted as "ready to reach".
export const READY_ROWS = [0, 3, 5];

const COLS = ['#', 'NAME', 'ROLE', 'COMPANY', 'EMAIL', 'STATUS'];
const WIDTHS = [70, 300, 280, 260, 380, 210];

const Check: React.FC = () => (
  <div
    style={{
      width: 30,
      height: 30,
      borderRadius: '50%',
      background: COLORS.ink,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const PeopleTable: React.FC<{
  frame: number;
  nameRevealStart?: number;
  nameStagger?: number;
  dataRevealStart?: number;
  dataStagger?: number;
  highlightStart?: number;
  width?: number;
}> = ({
  frame,
  nameRevealStart = -9999,
  nameStagger = 4,
  dataRevealStart = 9999,
  dataStagger = 3,
  highlightStart = 9999,
  width = 1500,
}) => {
  return (
    <div
      style={{
        width,
        background: COLORS.creamCard,
        borderRadius: 14,
        boxShadow: '0 14px 50px rgba(40, 45, 30, 0.09)',
        overflow: 'hidden',
        fontFamily: FONT_MONO,
      }}
    >
      <div style={{display: 'flex', background: '#EDEEE4', padding: '18px 26px'}}>
        {COLS.map((c, i) => (
          <div
            key={c}
            style={{
              width: WIDTHS[i],
              fontSize: 21,
              letterSpacing: '0.14em',
              color: '#8A8B7E',
              fontWeight: 500,
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {PEOPLE.map((p, i) => {
        const nameOn = interpolate(frame, [nameRevealStart + i * nameStagger, nameRevealStart + i * nameStagger + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const dataOn = interpolate(frame, [dataRevealStart + i * dataStagger, dataRevealStart + i * dataStagger + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const isReady = READY_ROWS.includes(i);
        const hl = isReady
          ? interpolate(frame, [highlightStart + READY_ROWS.indexOf(i) * 6, highlightStart + READY_ROWS.indexOf(i) * 6 + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 0;
        const dimOthers = interpolate(frame, [highlightStart, highlightStart + 14], [1, isReady ? 1 : 0.38], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const bad = p.status !== 'match';
        return (
          <div
            key={p.email}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '17px 26px',
              borderTop: '1px solid rgba(60, 70, 40, 0.08)',
              background: hl > 0 ? `rgba(255, 161, 61, ${hl * 0.45})` : 'transparent',
              opacity: dimOthers,
            }}
          >
            <div style={{width: WIDTHS[0], fontSize: 22, color: '#9A9B8E'}}>{i + 1}</div>
            <div style={{width: WIDTHS[1], fontSize: 24, color: COLORS.ink, opacity: nameOn}}>{p.name}</div>
            <div style={{width: WIDTHS[2], fontSize: 23, color: bad ? '#9A9B8E' : COLORS.ink, opacity: dataOn, fontFamily: FONT_SANS}}>
              {p.role}
            </div>
            <div
              style={{
                width: WIDTHS[3],
                fontSize: 23,
                fontWeight: 700,
                color: bad ? '#9A9B8E' : COLORS.ink,
                opacity: dataOn,
                fontFamily: FONT_SANS,
              }}
            >
              {p.company}
            </div>
            <div style={{width: WIDTHS[4], fontSize: 22, color: bad ? '#B0B1A4' : '#4A4B40', opacity: dataOn}}>{p.email}</div>
            <div style={{width: WIDTHS[5], opacity: dataOn, display: 'flex'}}>
              {hl > 0.4 ? (
                <div
                  style={{
                    fontSize: 19,
                    letterSpacing: '0.1em',
                    background: COLORS.greenWash,
                    border: `2px solid ${COLORS.ink}`,
                    borderRadius: 999,
                    padding: '5px 16px',
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  CONTACT
                </div>
              ) : p.status === 'match' ? (
                <Check />
              ) : (
                <span style={{fontSize: 21, color: '#B0B1A4'}}>{p.status}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
