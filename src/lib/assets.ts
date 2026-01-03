/**
 * Centralized local asset paths.
 *
 * Note: All referenced filenames include `dark-mode` per hackathon polish constraints.
 */

export const ASSETS = {
  logo: '/assets/icons/coffee-cup-icon-dark-mode-app-icon.png',
  loadingIcon: '/assets/icons/simple-dumpling-icon-3-dark-mode.png',

  mascot: {
    sleeping: '/assets/mascot/sleeping-state-dark-mode.png',
    waving: '/assets/mascot/waving-state-dark-mode.png',
    default: '/assets/mascot/default-state-dark-mode.png',
    thinking: '/assets/mascot/thinking-state-dark-mode.png',
    writing: '/assets/mascot/ready-to-write-state-dark-mode.png',
    reading: '/assets/mascot/reading-state-dark-mode.png',
    celebration: '/assets/mascot/celebration-state-dark-mode.png',
    error: '/assets/mascot/error-state-dark-mode.png',
    searching: '/assets/mascot/searching-state-dark-mode.png',
    coffee: '/assets/mascot/coffee-state-dark-mode.png',
  },
} as const;

export type MascotState = keyof typeof ASSETS.mascot;

/**
 * States whose assets were derived by copying/renaming a non-dark-mode source file.
 * Apply a subtle filter to better fit the dark palette.
 */
export const MASCOT_DERIVED_STATES: readonly MascotState[] = [
  'sleeping',
  'waving',
  'writing',
  'reading',
  'searching',
  'coffee',
];

