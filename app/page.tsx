import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* NAV */}
      <nav
        style={{
          padding: '20px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            Clear<span className='gradient-text'>Consent</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href='/doctor'
            className='btn-secondary'
            style={{ padding: '10px 20px', fontSize: 14 }}
          >
            Doctor Portal
          </Link>
          <span
            className='btn-primary'
            style={{
              padding: '10px 20px',
              fontSize: 14,
              opacity: 0.6,
              cursor: 'default',
            }}
          >
            HIPAA Ready
          </span>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 900,
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            className='animate-in'
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: 100,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
              fontSize: 14,
              color: 'var(--accent-blue-light)',
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            ⚡ $500M+ market • HIPAA-Ready Architecture
          </div>

          <h1
            className='animate-in stagger-1'
            style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Patients sign consent forms they{' '}
            <span className='gradient-text'>don&apos;t understand</span>
          </h1>

          <p
            className='animate-in stagger-2'
            style={{
              fontSize: 20,
              color: 'var(--text-secondary)',
              maxWidth: 640,
              margin: '0 auto 16px',
            }}
          >
            ClearConsent uses AI to transform complex medical consent documents
            into interactive, 6th-grade-level learning experiences — then{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              proves the patient understood
            </strong>
            .
          </p>

          <p
            className='animate-in stagger-2'
            style={{
              fontSize: 16,
              color: 'var(--text-muted)',
              maxWidth: 640,
              margin: '0 auto 40px',
            }}
          >
            Hospitals lose millions in &quot;failure to inform&quot; lawsuits.
            We generate legally defensible proof of patient comprehension.
          </p>

          <div
            className='animate-in stagger-3'
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href='/doctor'
              className='btn-primary'
              style={{ fontSize: 18, padding: '16px 36px' }}
            >
              🩺 I&apos;m a Doctor
            </Link>
            <Link
              href='/demo-patient'
              className='btn-secondary'
              style={{ fontSize: 18, padding: '16px 36px' }}
            >
              🧑 Try Patient Demo
            </Link>
          </div>

          {/* Stats */}
          <div
            className='animate-in stagger-4'
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              marginTop: 60,
              maxWidth: 600,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {[
              { value: '92%', label: "of patients don't read consent" },
              { value: '$4.2M', label: 'avg malpractice settlement' },
              { value: '6th', label: 'grade — FDA reading requirement' },
            ].map((stat, i) => (
              <div
                key={i}
                className='glass-card'
                style={{ padding: '20px 16px', textAlign: 'center' }}
              >
                <div
                  className='gradient-text'
                  style={{ fontSize: 28, fontWeight: 800 }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        style={{
          padding: '60px 40px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          How It <span className='gradient-text'>Works</span>
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
            maxWidth: 1000,
            margin: '0 auto',
          }}
        >
          {[
            {
              icon: '📄',
              title: 'Doctor Uploads Consent PDF',
              desc: 'Standard hospital consent form gets uploaded in seconds',
            },
            {
              icon: '🤖',
              title: 'AI Generates Explainer',
              desc: 'Gemini converts legal-speak to 6th-grade interactive learning',
            },
            {
              icon: '🧠',
              title: 'Patient Learns & Verifies',
              desc: 'Interactive education with real-time term explanations and comprehension checks',
            },
            {
              icon: '📜',
              title: 'Audit Certificate Issued',
              desc: 'Time-stamped, legally defensible proof of verified understanding',
            },
          ].map((step, i) => (
            <div
              key={i}
              className='glass-card'
              style={{ padding: '32px 24px', textAlign: 'center' }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{step.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: '24px 40px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        ClearConsent © 2026 — Built for Healthcare Hackathon •{' '}
        <span style={{ color: 'var(--accent-emerald)' }}>
          HIPAA-Ready Architecture
        </span>
      </footer>
    </main>
  );
}
