import React from 'react';
import {spring, useCurrentFrame, useVideoConfig, AbsoluteFill} from 'remotion';
import {COLORS, FONT_MONO, FONT_SERIF} from '../theme';

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const logoIn = spring({frame: frame - 4, fps, config: {damping: 200}, durationInFrames: 22});
  const subIn = spring({frame: frame - 22, fps, config: {damping: 200}, durationInFrames: 20});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            fontFamily: FONT_SERIF,
            fontWeight: 700,
            fontSize: 200,
            letterSpacing: '-0.03em',
            color: COLORS.ink,
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 40}px)`,
          }}
        >
          ploid<span style={{color: COLORS.orange}}>.</span>
        </div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 32,
            color: COLORS.inkSoft,
            marginTop: 28,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 24}px)`,
          }}
        >
          find the right people → <span style={{color: COLORS.orangeDeep, fontWeight: 700}}>ploid.com</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
