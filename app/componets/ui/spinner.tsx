import clsx from "clsx";

export function Spinner({
    className,
    ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) {
    return (
        <svg
            id="spinner"
            width="16px"
            height="16px"
            viewBox="0 0 16 16"
            fill="none"
            strokeLinecap="round"
            stroke="currentColor"
            strokeWidth="1px"
            xmlns="http://www.w3.org/2000/svg"
            className={clsx(
                "block h-5 w-5 shrink-0 animate-spin text-white mix-blend-difference",
                className,
            )}
            {...props}
        >
            <circle
                className="spinner-line"
                cx="8"
                cy="8"
                r="7"
                strokeDasharray="1 0.8"
                strokeDashoffset="1"
                pathLength="1"
            ></circle>
            <circle
                cx="8"
                cy="8"
                r="7"
                strokeOpacity="0.1"
                strokeDasharray="0.8 1"
                pathLength="1"
            ></circle>
        </svg>
    );
}
