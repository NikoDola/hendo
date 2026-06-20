// Type declarations for side-effect asset imports (e.g. `import '@/.../foo.css'`).
// Next.js provides these via `.next` generated types, but those aren't present
// until a build has run — so the editor's TS server can flag CSS imports with
// ts(2882) before the first build. Declaring them here makes resolution
// independent of `.next` so the warning never appears in any component.
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
