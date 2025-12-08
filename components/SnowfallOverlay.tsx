'use client';

import Snowfall from 'react-snowfall';

export function SnowfallOverlay() {
  return (
    <Snowfall
      snowflakeCount={150}
      color="#fff"
      radius={[0.5, 3.0]}
      wind={[-0.5, 2.0]}
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        zIndex: 9999, // In front of everything initially
        pointerEvents: 'none', // Allow clicks through snow
      }}
    />
  );
}
