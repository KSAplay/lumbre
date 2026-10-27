/** Icono de mesa simple (el + va en el badge del FAB) */
export const TablePlusIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <rect
      x="3"
      y="7"
      width="18"
      height="4"
      rx="0.9"
      stroke="currentColor"
      strokeWidth="1.75"
    />
    <path
      d="M6.5 11V18.5M17.5 11V18.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);
