import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Chip, CHIP_PEOPLE} from './Constellation';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

// The three matches, lined up and ready.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const matches = CHIP_PEOPLE.filter((p) => p.match);
  const headIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 20});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            fontSize: 110,
            letterSpacing: '-0.02em',
            color: COLORS.ink,
            opacity: headIn,
            transform: `translateY(${(1 - headIn) * 40}px)`,
          }}
        >
          3 people. <span style={{fontStyle: 'italic', color: COLORS.orangeDeep}}>ready to reach.</span>
        </div>

        <div style={{display: 'flex', gap: 54, marginTop: 90, justifyContent: 'center'}}>
          {matches.map((p, i) => {
            const cardIn = spring({
              frame: frame - 22 - i * 9,
              fps,
              config: {damping: 15, stiffness: 150},
              durationInFrames: 26,
            });
            return (
              <div
                key={p.name}
                style={{
                  opacity: Math.min(1, cardIn * 1.3),
                  transform: `translateY(${(1 - cardIn) * 70}px)`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 26,
                }}
              >
                <Chip p={p} state={1} scale={1.25} />
                <div
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 23,
                    letterSpacing: '0.14em',
                    background: COLORS.ink,
                    color: COLORS.paper,
                    borderRadius: 999,
                    padding: '12px 30px',
                  }}
                >
                  CONTACT →
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
