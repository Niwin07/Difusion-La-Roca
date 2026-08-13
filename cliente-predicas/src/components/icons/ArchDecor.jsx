export function ArchDecor(props) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M15 95 L15 38 Q15 5 50 5 Q85 5 85 38 L85 95"
        stroke="var(--copper-400)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M24 95 L24 41 Q24 14 50 14 Q76 14 76 41 L76 95"
        stroke="var(--copper-400)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
