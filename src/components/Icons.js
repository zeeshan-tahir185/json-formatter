// Lightweight inline SVG icons (no external dependency).
// Each accepts standard svg props (className, etc.).

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconFormat = (p) => (
  <svg {...base} {...p}>
    <path d="M4 6h16M4 12h10M4 18h7" />
  </svg>
);

export const IconMinify = (p) => (
  <svg {...base} {...p}>
    <path d="M4 8h16M4 16h16" />
    <path d="M9 5l3 3 3-3M9 19l3-3 3 3" />
  </svg>
);

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconCheckCircle = (p) => (
  <svg {...base} {...p}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <path d="M22 4L12 14.01l-3-3" />
  </svg>
);

export const IconAlert = (p) => (
  <svg {...base} {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const IconCopy = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export const IconDownload = (p) => (
  <svg {...base} {...p}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <path d="M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const IconUpload = (p) => (
  <svg {...base} {...p}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <path d="M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
);

export const IconTree = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="6" height="6" rx="1" />
    <rect x="15" y="9" width="6" height="6" rx="1" />
    <rect x="15" y="15" width="6" height="6" rx="1" />
    <path d="M9 6h3a3 3 0 013 3v3M12 9v6a3 3 0 003 3" />
  </svg>
);

export const IconCode = (p) => (
  <svg {...base} {...p}>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

export const IconSun = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

export const IconMoon = (p) => (
  <svg {...base} {...p}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export const IconChevron = (p) => (
  <svg {...base} {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const IconSwap = (p) => (
  <svg {...base} {...p}>
    <path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4" />
  </svg>
);

export const IconCompare = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="7" height="16" rx="1" />
    <rect x="14" y="4" width="7" height="16" rx="1" />
  </svg>
);

export const IconExpand = (p) => (
  <svg {...base} {...p}>
    <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M16 21h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
  </svg>
);

export const IconCollapse = (p) => (
  <svg {...base} {...p}>
    <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
  </svg>
);

export const IconSparkle = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4z" />
    <path d="M19 14l.7 1.7L21.5 16l-1.8.6L19 18l-.7-1.4L16.5 16l1.8-.3z" />
  </svg>
);

// Brand mark: a stylised pair of JSON braces.
export const IconBraces = (p) => (
  <svg {...base} {...p}>
    <path d="M8 4c-1.6 0-2.2 1-2.2 2.6v2C5.8 10 5.2 10.8 4 11.5c1.2.7 1.8 1.5 1.8 2.9v2C5.8 18 6.4 19 8 19" />
    <path d="M16 4c1.6 0 2.2 1 2.2 2.6v2c0 1.4.6 2.2 1.8 2.9-1.2.7-1.8 1.5-1.8 2.9v2C18.2 18 17.6 19 16 19" />
  </svg>
);

// Used for the "runs in your browser" privacy line.
export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l7 3v5c0 4.6-3.1 7.7-7 9-3.9-1.3-7-4.4-7-9V6z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconBolt = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6z" />
  </svg>
);
