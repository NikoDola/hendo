// src/app/error.tsx
'use client'
export default function Error({ error }: { error: Error }) {
  return <pre style={{ padding:16, whiteSpace:'pre-wrap' }}>{error?.message}</pre>
}
