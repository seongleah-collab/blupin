import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONT_MONO, FONT_SANS} from '../theme';
import {PromptDock} from './PromptDock';
import {PeopleTable} from './PeopleTable';

const Layout: React.FC<{children: React.ReactNode; camera: string}> = ({children, camera}) => (
  <AbsoluteFill style={{fontFamily: FONT_SANS}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: camera,
        transformOrigin: '50% 40%',
      }}
    >
      <div style={{position: 'absolute', top: 64, left: 84}}>
        <PromptDock />
      </div>
      {/* connector from prompt down to the table */}
      <div
        style={{
          position: 'absolute',
          top: 194,
          left: 489,
          width: 2,
          height: 68,
          background: 'rgba(60, 70, 40, 0.25)',
        }}
      />
      <div style={{position: 'absolute', top: 276, left: '50%', transform: 'translateX(-50%)'}}>
        {children}
      </div>
    </div>
  </AbsoluteFill>
);

// Scene: zoom out from the prompt, table appears, names stream in.
export const TableReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const settle = spring({frame, fps, config: {damping: 200}, durationInFrames: 26});
  const scale = 1.55 - settle * 0.55;
  const ty = (1 - settle) * 260;

  return (
    <Layout camera={`scale(${scale}) translateY(${ty}px)`}>
      <PeopleTable frame={frame} nameRevealStart={18} nameStagger={5} />
    </Layout>
  );
};

// Scene: start tight on row 1 as data fills, zoom out, rest fills, then highlight payoff.
export const TablePayoff: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const zoomOut = spring({frame: frame - 42, fps, config: {damping: 200}, durationInFrames: 30});
  const scale = 1.85 - zoomOut * 0.85;
  const ty = (1 - zoomOut) * 150;

  const pillIn = spring({frame: frame - 116, fps, config: {damping: 200}, durationInFrames: 20});

  return (
    <AbsoluteFill>
      <Layout camera={`scale(${scale}) translateY(${ty}px)`}>
        <PeopleTable
          frame={frame}
          nameRevealStart={-9999}
          dataRevealStart={6}
          dataStagger={7}
          highlightStart={112}
        />
      </Layout>
      <div
        style={{
          position: 'absolute',
          top: 196,
          right: 200,
          opacity: pillIn,
          transform: `translateY(${(1 - pillIn) * 24}px)`,
          background: COLORS.greenWash,
          border: `3px solid ${COLORS.ink}`,
          borderRadius: 999,
          padding: '14px 34px',
          fontFamily: FONT_MONO,
          fontSize: 30,
          fontWeight: 700,
          color: COLORS.ink,
          boxShadow: '0 10px 30px rgba(40, 45, 30, 0.12)',
        }}
      >
        3 verified → ready to reach
      </div>
    </AbsoluteFill>
  );
};
