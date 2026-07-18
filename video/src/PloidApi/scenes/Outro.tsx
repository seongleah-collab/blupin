import React from 'react';
import {Img, spring, staticFile, useCurrentFrame, useVideoConfig, AbsoluteFill} from 'remotion';
import {COLORS, FONT_MONO} from '../theme';

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
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 40}px)`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Official lettermark (mark + PLOID) from ploid.com */}
          <Img src={staticFile('ploid-lettermark.svg')} style={{width: 780, height: 'auto'}} />
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
