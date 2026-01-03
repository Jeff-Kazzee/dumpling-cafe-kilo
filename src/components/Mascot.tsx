'use client';

/* eslint-disable @next/next/no-img-element */
import React from 'react';
import clsx from 'clsx';

import { ASSETS, MASCOT_DERIVED_STATES } from '../lib/assets';
import type { MascotState } from '../lib/assets';

export type { MascotState } from '../lib/assets';

interface MascotProps {
  state: MascotState;
  className?: string;
}

export function Mascot({ state, className }: MascotProps) {
  const needsDerivedTreatment = MASCOT_DERIVED_STATES.includes(state);

  return (
    <img 
      src={ASSETS.mascot[state]} 
      alt={`Dumpling Mascot - ${state}`} 
      className={clsx(
        className,
        needsDerivedTreatment && 'filter brightness-90 saturate-90 opacity-90'
      )}
    />
  );
}
