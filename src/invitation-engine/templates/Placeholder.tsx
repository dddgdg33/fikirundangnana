import type { InvitationTemplateProps } from '@/invitation-engine/types'

/** Placeholder sementara —akan diganti dengan implementasi template aslinya satu per satu. */
export default function PlaceholderTemplate({ name }: { name: string } & InvitationTemplateProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        background: '#f7f3ee',
        color: '#5a4636',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div>
        <p style={{ letterSpacing: '0.35em', fontSize: '0.8rem', opacity: 0.6 }}>INVITATION ENGINE</p>
        <h1 style={{ fontWeight: 400, margin: '0.75rem 0' }}>Template “{name}”</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Sedang dalam implementasi — akan tersedia pada tahap berikutnya.</p>
      </div>
    </div>
  )
}
