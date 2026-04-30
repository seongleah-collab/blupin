// 20 stacked concentric rounded rectangles — three clean ombre tiers,
// trimmed from 36 to keep the GPU happy during the scroll-driven zoom.
// blue (outer) → mint (middle, all clearly green) → white core.
const layers = [
  // blue tier (6)
  { top: '#3b82f6', bottom: '#3b82f6' },
  { top: '#5391f4', bottom: '#5391f4' },
  { top: '#69a0f6', bottom: '#69a0f6' },
  { top: '#7faff8', bottom: '#7faff8' },
  { top: '#92bdfa', bottom: '#92bdfa' },
  { top: '#a2cffe', bottom: '#a2cffe' },
  // blue → mint hand-off
  { top: '#aedce5', bottom: '#aedce5' },
  // mint tier (8) — all clearly green
  { top: '#97d2c4', bottom: '#97d2c4' },
  { top: '#9ed7ca', bottom: '#9ed7ca' },
  { top: '#a3dccf', bottom: '#a3dccf' },
  { top: '#a7e0d3', bottom: '#a7e0d3' },
  { top: '#aae4d8', bottom: '#aae4d8' },
  { top: '#ace7da', bottom: '#ace7da' },
  { top: '#aeebe0', bottom: '#aeebe0' },
  { top: '#aeebe0', bottom: '#aeebe0' },
  // mint → white hand-off
  { top: '#d8f3ed', bottom: '#d8f3ed' },
  // white tier (4)
  { top: '#eef9f6', bottom: '#eef9f6' },
  { top: '#f8fdfc', bottom: '#f8fdfc' },
  { top: '#ffffff', bottom: '#ffffff' },
  { top: '#ffffff', bottom: '#ffffff' },
];

export default function ConcentricGradient({
  className = '',
  aspectRatio = '16 / 9',
}: {
  className?: string;
  aspectRatio?: string;
}) {
  const step = 100 / (layers.length * 2);

  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio }}>
      {layers.map((layer, i) => {
        // outermost layer (i=0) sits flush with the wrapper edges so
        // there's no white border between the frame and the first ring.
        // i=0 also has 0 radius so the wrapper's rounded-3xl clip is
        // the only thing shaping the corners — otherwise the layer's
        // own 140px arc would leave white triangles in the wrapper.
        const inset = `${i * step}%`;
        const radius = i === 0 ? '0px' : `${Math.max(140 - i * 4, 40)}px`;
        // static rings — no per-layer animation, no will-change.
        // only the parent wrapper transforms during the scroll zoom,
        // so the browser composites just one layer instead of 20+.
        return (
          <div
            key={i}
            aria-hidden
            className="absolute"
            style={{
              top: inset,
              left: inset,
              right: inset,
              bottom: 0,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              background: layer.top,
            }}
          />
        );
      })}
    </div>
  );
}
