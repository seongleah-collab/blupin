import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';

// Profile card for the top search result before the search dive.
export const NameCloseup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const cardIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});
  const rowIn = spring({frame: frame - 10, fps, config: {damping: 200}, durationInFrames: 18});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT_SANS}}>
      <div
        style={{
          width: 860,
          background: COLORS.creamCard,
          borderRadius: 26,
          boxShadow: '0 20px 70px rgba(40, 45, 30, 0.12), 0 2px 10px rgba(40, 45, 30, 0.06)',
          padding: '54px 60px',
          display: 'flex',
          alignItems: 'center',
          gap: 44,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 60}px) scale(${0.96 + cardIn * 0.04})`,
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: COLORS.greenWash,
            border: `3px solid ${COLORS.greenDark}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.greenDark,
            flexShrink: 0,
          }}
        >
          MC
        </div>
        <div style={{opacity: rowIn, transform: `translateY(${(1 - rowIn) * 24}px)`}}>
          <div style={{fontSize: 62, fontWeight: 700, letterSpacing: '-0.02em', color: COLORS.ink}}>
            Maya Chen
          </div>
          <div style={{fontSize: 34, color: COLORS.inkSoft, marginTop: 10}}>
            Head of Growth · Driftline
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 24,
              color: COLORS.greenDark,
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: COLORS.greenBright,
                display: 'inline-block',
              }}
            />
            NYC · verified live
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
