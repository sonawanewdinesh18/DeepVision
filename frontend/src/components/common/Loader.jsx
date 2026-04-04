/**
 * Loader — Spinner component
 * Usage: <Spinner /> | <Spinner size="sm" /> | <Spinner size="lg" />
 */

const sizes = {
    sm: 16,
    md: 22,
    lg: 36,
};

export function Spinner({ size = 'md', color = 'var(--color-primary)' }) {
    const px = sizes[size] ?? sizes.md;

    return (
        <svg
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Loading…"
            style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
        >
            <circle
                cx="12" cy="12" r="10"
                stroke={color}
                strokeOpacity="0.2"
                strokeWidth="3"
            />
            <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
    );
}

export default Spinner;
