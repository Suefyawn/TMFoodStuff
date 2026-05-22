'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          textAlign: 'center',
          background: '#f9fafb',
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
          color: '#111827',
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 16 }}>🥦</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px' }}>Something went wrong</h1>
        <p style={{ color: '#6b7280', fontSize: 17, margin: '0 0 28px', maxWidth: 360 }}>
          We hit an unexpected error. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#16a34a',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            padding: '14px 32px',
            border: 'none',
            borderRadius: 16,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  )
}
