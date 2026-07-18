import {interpolate} from 'remotion';

// Characters typed between `start` and `start + durationInFrames`.
export const typed = (
  frame: number,
  text: string,
  start: number,
  durationInFrames: number,
): string => {
  const n = Math.round(
    interpolate(frame, [start, start + durationInFrames], [0, text.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return text.slice(0, n);
};

export const blink = (frame: number, period = 16): number =>
  Math.floor(frame / period) % 2 === 0 ? 1 : 0;

export const fadeInUp = (
  frame: number,
  start: number,
  duration = 12,
  distance = 30,
): {opacity: number; transform: string} => {
  const t = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eased = 1 - (1 - t) ** 3;
  return {
    opacity: eased,
    transform: `translateY(${(1 - eased) * distance}px)`,
  };
};
