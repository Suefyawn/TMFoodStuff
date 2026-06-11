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
        {/* Inline SVG (lucide "leaf") — global-error renders without the app
            layout, so keep it dependency-free and self-contained. */}
        <div
          aria-hidden="true"
          style={{
            width: 80, height: 80, borderRadius: 24, background: '#dcfce7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>
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
