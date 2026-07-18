import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS} from './theme';

export const DotGrid: React.FC<{
  dark?: boolean;
  opacity?: number;
}> = ({dark = false, opacity = 1}) => {
  const dot = dark ? 'rgba(232, 234, 228, 0.07)' : COLORS.grid;
  const line = dark ? 'rgba(232, 234, 228, 0.03)' : 'rgba(60, 70, 40, 0.045)';
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: [
          `radial-gradient(${dot} 2.4px, transparent 2.4px)`,
          `linear-gradient(${line} 1px, transparent 1px)`,
          `linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        ].join(', '),
        backgroundSize: '46px 46px, 138px 138px, 138px 138px',
        backgroundPosition: '23px 23px, 0 0, 0 0',
      }}
    />
  );
};
