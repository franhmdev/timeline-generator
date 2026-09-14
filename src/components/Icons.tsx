import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 16): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const CalendarIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h2M8 18h2M14 14h2M14 18h2" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const DiamondIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M12 2l10 10-10 10L2 12 12 2z" />
  </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
  </svg>
);

export const DownloadIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const FileIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const ResetIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const XIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const FlagIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <path d="M4 22v-7" />
  </svg>
);

export const GripIcon: React.FC<IconProps> = ({ size, ...p }) => (
  <svg {...base(size)} {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
);
