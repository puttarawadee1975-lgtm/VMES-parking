import React from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { Canvas, DiffRect, rect, rrect } from '@shopify/react-native-skia';

const { width, height } = Dimensions.get('window');

// 288px width/height matches the w-72 h-72 from Tailwind (72 * 4 = 288)
const innerDimension = 288;

// Outer bounds cover the whole screen
const outer = rrect(rect(0, 0, width, height), 0, 0);

// Inner bounds creates the "hole" in the middle
const inner = rrect(
  rect(
    width / 2 - innerDimension / 2,
    height / 2 - innerDimension / 2, // Centered
    innerDimension,
    innerDimension
  ),
  24, // Corner radius (rounded-3xl roughly)
  24
);

export default function ScannerOverlay() {
  return (
    <Canvas
      style={
        Platform.OS === 'android' ? { flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } : StyleSheet.absoluteFillObject
      }
      pointerEvents="none"
    >
      <DiffRect inner={inner} outer={outer} color="black" opacity={0.65} />
    </Canvas>
  );
}
