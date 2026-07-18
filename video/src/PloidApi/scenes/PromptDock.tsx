import React from 'react';
import {COLORS, FONT_SANS} from '../theme';
import {PROMPT_TEXT, SendButton} from './PromptScene';

// The docked, small version of the prompt card shown above the table.
export const PromptDock: React.FC = () => (
  <div
    style={{
      width: 810,
      background: COLORS.creamCard,
      borderRadius: 16,
      boxShadow: '0 12px 40px rgba(40, 45, 30, 0.10)',
      padding: '26px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: FONT_SANS,
    }}
  >
    <span style={{fontSize: 24, color: COLORS.ink, whiteSpace: 'nowrap'}}>{PROMPT_TEXT}</span>
    <SendButton size={52} />
  </div>
);
