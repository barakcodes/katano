import { useState, useEffect, useRef } from "react";

export function useInterval(delay: number): number {
    const [count, setCount] = useState(0);
    const savedCallback = useRef<() => void>();

    useEffect(() => {
        savedCallback.current = () => setCount((prevCount) => prevCount + 1);
    });

    useEffect(() => {
        function tick() {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }

        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);

    return count;
}
