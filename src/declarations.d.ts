declare module '*.mov' {
    const src: string;
    export default src;
}

// Vite's import.meta.glob type definitions
interface ImportMeta {
    glob<T = Record<string, unknown>>(
        pattern: string | string[],
        options?: {
            eager?: boolean;
            import?: string;
            query?: string | Record<string, string | number | boolean>;
            as?: string;
        }
    ): Record<string, T>;
}
