import { clsx } from "clsx";

export function Text({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"p">) {
    return (
        <p
            {...props}
            data-slot="text"
            className={clsx(
                "text-base/6 text-zinc-500 sm:text-sm/6 dark:text-zinc-400",
                className,
            )}
        />
    );
}

export function Strong({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"strong">) {
    return (
        <strong
            {...props}
            className={clsx(
                "font-medium text-zinc-950 dark:text-white",
                className,
            )}
        />
    );
}

export function H1({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"h1">) {
    return (
        <h1
            {...props}
            data-slot="h1"
            className={clsx(
                "text-4xl font-semibold leading-relaxed tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100",
                className,
            )}
        />
    );
}

export function H2({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"h2">) {
    return (
        <h2
            {...props}
            data-slot="h2"
            className={clsx(
                "text-xl/6 font-semibold tracking-tight text-zinc-800 sm:text-2xl/6 dark:text-zinc-100",
                className,
            )}
        />
    );
}
