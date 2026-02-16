'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function DoctorPortal() {
  const [doctorName, setDoctorName] = useState('');
  const [procedureName, setProcedureName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    formId: string;
    patientLink: string;
  } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !doctorName || !procedureName) {
      setError('Please fill all fields and upload a PDF');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('doctorName', doctorName);
      formData.append('procedureName', procedureName);

      const res = await fetch('/api/upload-consent', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fullLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${result?.patientLink}`
      : result?.patientLink || '';

  return (
    <main style={{ minHeight: '100vh' }}>
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
        <Link
          href='/'
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span style={{ fontSize: 28 }}>🛡️</span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            Clear<span className='gradient-text'>Consent</span>
          </span>
        </Link>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          🩺 Doctor Portal
        </span>
      </nav>

      <div
        style={{
          maxWidth: 640,
          margin: '40px auto',
          padding: '0 24px',
        }}
      >
        <h1
          className='animate-in'
          style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}
        >
          Upload Consent <span className='gradient-text'>Form</span>
        </h1>
        <p
          className='animate-in stagger-1'
          style={{
            color: 'var(--text-secondary)',
            marginBottom: 36,
            fontSize: 16,
          }}
        >
          Upload your hospital&apos;s consent PDF. Our AI will generate an
          interactive explainer for your patient.
        </p>

        {!result ? (
          <div className='animate-in stagger-2'>
            {/* Doctor Name */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-secondary)',
                }}
              >
                Doctor Name
              </label>
              <input
                type='text'
                className='input-field'
                placeholder='Dr. Jane Smith'
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>

            {/* Procedure Name */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-secondary)',
                }}
              >
                Procedure Name
              </label>
              <input
                type='text'
                className='input-field'
                placeholder='e.g. Knee Replacement Surgery'
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
              />
            </div>

            {/* Upload Zone */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: 'var(--text-secondary)',
                }}
              >
                Consent Form (PDF)
              </label>
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f?.type === 'application/pdf') setFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type='file'
                  accept={
                    process.env.NODE_ENV === 'development'
                      ? '.pdf,.docx'
                      : '.docx'
                  }
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                {file ? (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {(file.size / 1024).toFixed(1)} KB • Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Drop your consent PDF here
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      or click to browse files
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--accent-rose)',
                  fontSize: 14,
                  marginBottom: 20,
                }}
              >
                {error}
              </div>
            )}

            <button
              className='btn-primary'
              onClick={handleUpload}
              disabled={loading}
              style={{ width: '100%', fontSize: 16 }}
            >
              {loading ? (
                <>
                  <div
                    className='spinner'
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />
                  Generating AI Explainer...
                </>
              ) : (
                <>🚀 Generate Patient Explainer</>
              )}
            </button>

            {loading && (
              <p
                style={{
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 14,
                  color: 'var(--text-muted)',
                }}
              >
                AI is reading the consent form and creating a 6th-grade
                explanation...
              </p>
            )}
          </div>
        ) : (
          /* SUCCESS STATE */
          <div className='glass-card animate-in' style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>
                Patient Explainer Ready!
              </h2>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  marginTop: 8,
                  fontSize: 15,
                }}
              >
                Share this link with your patient. They&apos;ll see an
                interactive explanation and must verify understanding before
                signing.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: 'var(--accent-cyan)',
                marginBottom: 20,
              }}
            >
              {fullLink}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className='btn-primary'
                style={{ flex: 1 }}
                onClick={() => navigator.clipboard.writeText(fullLink)}
              >
                📋 Copy Link
              </button>
              <Link
                href={result.patientLink}
                className='btn-secondary'
                style={{ flex: 1, textAlign: 'center' }}
              >
                👁️ Preview
              </Link>
            </div>

            <button
              className='btn-secondary'
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                setResult(null);
                setFile(null);
                setDoctorName('');
                setProcedureName('');
              }}
            >
              + Upload Another Consent
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
