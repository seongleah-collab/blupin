import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {blink, typed} from '../helpers';
import {COLORS, FONT_SANS} from '../theme';

export const QUERY = 'find heads of growth at seed-stage fintechs in nyc';

// The ask, typed into a chat box like an LLM prompt.
export const QueryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const cardIn = spring({frame, fps, config: {damping: 200}, durationInFrames: 18});
  const typeStart = 14;
  const typeDur = 74;
  const text = typed(frame, QUERY, typeStart, typeDur);
  const doneTyping = frame >= typeStart + typeDur;

  // Send button "click" pulse shortly after typing finishes.
  const clickAt = typeStart + typeDur + 12;
  const pulse = spring({
    frame: frame - clickAt,
    fps,
    config: {damping: 12, stiffness: 200},
    durationInFrames: 20,
  });
  const pulseValue = frame >= clickAt ? Math.sin(Math.min(1, pulse) * Math.PI) : 0;

  const out = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT_SANS, opacity: out}}
    >
      <div
        style={{
          width: 1370,
          minHeight: 226,
          background: COLORS.paperCard,
          borderRadius: 24,
          boxShadow: '0 18px 60px rgba(60, 40, 20, 0.10), 0 2px 8px rgba(60, 40, 20, 0.06)',
          padding: '44px 48px',
          position: 'relative',
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 50}px) scale(${0.97 + cardIn * 0.03})`,
        }}
      >
        <span style={{fontSize: 44, color: COLORS.ink, letterSpacing: '-0.01em'}}>
          {text}
          {!doneTyping || blink(frame) ? (
            <span
              style={{
                display: 'inline-block',
                width: 4,
                height: 44,
                background: COLORS.orange,
                marginLeft: 6,
                verticalAlign: 'middle',
                borderRadius: 2,
              }}
            />
          ) : null}
        </span>
        <div
          style={{
            position: 'absolute',
            right: 36,
            bottom: 36,
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: COLORS.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${1 + pulseValue * 0.14})`,
            boxShadow: '0 6px 26px rgba(255, 107, 26, 0.4)',
          }}
        >
          <svg width={34} height={34} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20V5M12 5L5.5 11.5M12 5L18.5 11.5"
              stroke={COLORS.paper}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
