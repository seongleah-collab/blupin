import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS, FONT_SERIF} from '../theme';

// Editorial close-up on the top match.
export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const railIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const nameIn = spring({frame: frame - 8, fps, config: {damping: 200}, durationInFrames: 20});
  const metaIn = spring({frame: frame - 20, fps, config: {damping: 200}, durationInFrames: 18});

  return (
    <AbsoluteFill style={{justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'stretch', gap: 64, paddingLeft: 280}}>
        <div
          style={{
            width: 18,
            borderRadius: 9,
            background: COLORS.orange,
            transform: `scaleY(${railIn})`,
            transformOrigin: 'top',
          }}
        />
        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 25,
              letterSpacing: '0.22em',
              color: COLORS.orangeDeep,
              opacity: nameIn,
            }}
          >
            TOP MATCH
          </div>
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontWeight: 700,
              fontSize: 148,
              letterSpacing: '-0.02em',
              color: COLORS.ink,
              lineHeight: 1.05,
              marginTop: 14,
              opacity: nameIn,
              transform: `translateY(${(1 - nameIn) * 50}px)`,
            }}
          >
            Maya Chen
          </div>
          <div style={{opacity: metaIn, transform: `translateY(${(1 - metaIn) * 30}px)`}}>
            <div style={{fontFamily: FONT_SANS, fontSize: 44, color: COLORS.inkSoft, marginTop: 26}}>
              Head of Growth · Driftline
            </div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 27,
                color: COLORS.orangeDeep,
                marginTop: 22,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{width: 15, height: 15, borderRadius: '50%', background: COLORS.orange, display: 'inline-block'}} />
              NYC · verified live
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
