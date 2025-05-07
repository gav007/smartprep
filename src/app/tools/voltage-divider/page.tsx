// src/app/tools/voltage-divider/page.tsx
'use client';

import React from 'react';
import VoltageDividerCalculator from '@/components/calculators/VoltageDividerCalculator';

export default function VoltageDividerPage() {
  // Container and padding handled by src/app/tools/layout.tsx
  // The VoltageDividerCalculator component itself is a Card.
  return <VoltageDividerCalculator />;
}
