// --- Spring transition configs (positional / scale animations) ---

/** Toggle thumb, tab indicator */
export const SPRING_SNAPPY = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

/** Button hover/tap, token pill */
export const SPRING_CONTROLLED = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

/** Flip button rotation */
export const SPRING_FLIP = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 22,
};

/** Swap/bridge card entrance */
export const SPRING_CARD_ENTRY = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  delay: 0.05,
};

/** Side panel slide */
export const SPRING_PANEL_SLIDE = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 32,
  mass: 0.8,
};

/** Modal pop entrance */
export const SPRING_MODAL_POP = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
};

/** Settings cog rotation */
export const SPRING_COG = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
};

/** Tabs indicator — slightly different from SPRING_SNAPPY (no mass) */
export const SPRING_TABS = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// --- Instant / reduced-motion fallback ---

export const INSTANT_TRANSITION = { duration: 0 };

// --- Overlay animations (modal + side panel shared) ---

export const OVERLAY_ANIMATE = { opacity: [0, 1] };
export const OVERLAY_EXIT = { opacity: 0 };
export const OVERLAY_TRANSITION = { duration: 0.25 };

// --- Reduced-motion container fallback ---

export const REDUCED_CONTAINER_ANIMATE = { opacity: [0, 1] };
export const REDUCED_CONTAINER_TRANSITION = { duration: 0.15 };
