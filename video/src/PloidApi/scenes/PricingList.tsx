import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

const OLD_STACK = [
  {name: 'Apollo', price: '$4,000 / yr'},
  {name: 'ZoomInfo', price: '$15K+ / yr'},
  {name: 'Clay', price: 'credits ×3'},
];

const STRIKE_AT = 40;
const CARD_AT = 74;

// The old stack struck off line by line; ploid lands as an orange block.
export const PricingList: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const headIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const cardIn = spring({frame: frame - CARD_AT, fps, config: {damping: 14, stiffness: 130}, durationInFrames: 26});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 150}}>
        <div>
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              fontSize: 84,
              letterSpacing: '-0.02em',
              color: COLORS.ink,
              marginBottom: 54,
              opacity: headIn,
              transform: `translateY(${(1 - headIn) * 30}px)`,
            }}
          >
            we killed the <span style={{fontStyle: 'italic'}}>data stack.</span>
          </div>
          {OLD_STACK.map((s, i) => {
            const rowIn = spring({frame: frame - 10 - i * 6, fps, config: {damping: 200}, durationInFrames: 16});
            const strike = interpolate(frame, [STRIKE_AT + i * 8, STRIKE_AT + i * 8 + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={s.name}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 34,
                  marginBottom: 34,
                  opacity: rowIn * (1 - strike * 0.5),
                  transform: `translateY(${(1 - rowIn) * 24}px)`,
                  position: 'relative',
                  width: 'fit-content',
                }}
              >
                <span style={{fontFamily: FONT_SERIF, fontWeight: 600, fontSize: 58, color: COLORS.ink}}>{s.name}</span>
                <span style={{fontFamily: FONT_MONO, fontSize: 30, color: COLORS.inkSoft}}>{s.price}</span>
                <div
                  style={{
                    position: 'absolute',
                    left: -14,
                    top: '52%',
                    height: 7,
                    width: `calc(${strike * 100}% + ${strike * 28}px)`,
                    background: COLORS.orange,
                    borderRadius: 4,
                    opacity: strike > 0 ? 1 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div
          style={{
            background: COLORS.orange,
            borderRadius: 28,
            padding: '64px 70px',
            textAlign: 'center',
            opacity: Math.min(1, cardIn),
            transform: `scale(${0.85 + Math.min(1, cardIn) * 0.15}) rotate(${(1 - Math.min(1, cardIn)) * 4}deg)`,
            boxShadow: '0 24px 70px rgba(255, 107, 26, 0.35)',
          }}
        >
          <div style={{fontFamily: FONT_SERIF, fontWeight: 700, fontSize: 92, color: COLORS.paper}}>
            ploid<span style={{color: COLORS.ink}}>.</span>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 26,
              color: COLORS.paper,
              marginTop: 26,
              lineHeight: 1.8,
            }}
          >
            one credit pool
            <br />
            no seats · no surprise overages
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
