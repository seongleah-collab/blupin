import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

const STACK = [
  {name: 'Apollo', price: 'seats'},
  {name: 'ZoomInfo', price: '$15K+ / yr'},
  {name: 'Clay', price: 'credits×3'},
];

const CROSS_AT = 58;
const GREEN_AT = 78;

const CrossedCard: React.FC<{name: string; sub: string; index: number}> = ({name, sub, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inSpring = spring({frame: frame - 14 - index * 7, fps, config: {damping: 200}, durationInFrames: 18});
  const cross = interpolate(frame, [CROSS_AT + index * 6, CROSS_AT + index * 6 + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dim = 1 - cross * 0.55;

  return (
    <div style={{textAlign: 'center', opacity: inSpring, transform: `translateY(${(1 - inSpring) * 40}px)`}}>
      <div
        style={{
          width: 340,
          height: 150,
          background: COLORS.creamCard,
          borderRadius: 18,
          boxShadow: '0 12px 40px rgba(40, 45, 30, 0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transform: `rotate(${cross * (index % 2 === 0 ? -2 : 2)}deg)`,
        }}
      >
        <span style={{fontFamily: FONT_SANS, fontSize: 44, fontWeight: 700, color: COLORS.ink, opacity: dim}}>
          {name}
        </span>
        <svg
          style={{position: 'absolute', inset: 0, opacity: cross > 0 ? 1 : 0}}
          width={340}
          height={150}
          viewBox="0 0 340 150"
        >
          <line
            x1={40} y1={30} x2={40 + 260 * cross} y2={30 + 90 * cross}
            stroke={COLORS.ink} strokeWidth={9} strokeLinecap="round"
          />
          <line
            x1={300} y1={30} x2={300 - 260 * cross} y2={30 + 90 * cross}
            stroke={COLORS.ink} strokeWidth={9} strokeLinecap="round"
          />
        </svg>
      </div>
      <div style={{marginTop: 20, fontFamily: FONT_SANS, fontSize: 30, color: '#9A9B8E', opacity: 0.4 + cross * 0.6}}>
        {sub}
      </div>
    </div>
  );
};

export const PricingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const headSwap = interpolate(frame, [CROSS_AT - 8, CROSS_AT + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const greenIn = spring({frame: frame - GREEN_AT, fps, config: {damping: 14, stiffness: 120}, durationInFrames: 26});

  return (
    <AbsoluteFill style={{alignItems: 'center', fontFamily: FONT_SANS}}>
      <div
        style={{
          marginTop: 150,
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: COLORS.ink,
          opacity: headIn,
          transform: `translateY(${(1 - headIn) * 30}px)`,
          height: 90,
        }}
      >
        {headSwap < 0.5 ? 'we killed the data stack.' : 'same depth. one place. pay as you go.'}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 46,
          marginTop: 110,
          alignItems: 'flex-start',
          // Keep the visible cards centered before the green card takes its slot.
          transform: `translateX(${(1 - Math.min(1, greenIn)) * 278}px)`,
        }}
      >
        {STACK.map((s, i) => (
          <CrossedCard key={s.name} name={s.name} sub={s.price} index={i} />
        ))}

        <div
          style={{
            width: 470,
            marginLeft: 40,
            background: COLORS.greenWash,
            border: `3px solid ${COLORS.ink}`,
            borderRadius: 20,
            padding: '36px 40px',
            textAlign: 'center',
            boxShadow: '0 16px 50px rgba(28, 107, 60, 0.18)',
            opacity: Math.min(1, greenIn),
            transform: `scale(${0.8 + greenIn * 0.2}) translateY(${(1 - Math.min(1, greenIn)) * 30}px)`,
          }}
        >
          <div style={{fontSize: 50, fontWeight: 700, color: COLORS.ink}}>
            ploid<span style={{color: COLORS.greenDark}}>.</span>
          </div>
          <div style={{fontFamily: FONT_MONO, fontSize: 28, color: COLORS.greenDark, marginTop: 16}}>
            search · enrich · reason
          </div>
          <div style={{fontFamily: FONT_MONO, fontSize: 24, color: '#3E6B4E', marginTop: 18, lineHeight: 1.6}}>
            one credit pool · no seats
            <br />
            no surprise overages
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
