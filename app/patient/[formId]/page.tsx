'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { highlightMedicalTerms } from './highlightTerms';

interface KeyPoint {
  title: string;
  explanation: string;
  analogy: string;
  icon: string;
}

interface MedicalTerm {
  term: string;
  definition: string;
  simpleAnalogy: string;
}

interface RiskItem {
  name: string;
  likelihood: string;
  likelihoodPercent: number;
  severity: string;
  description: string;
}

interface QuizQuestion {
  id: number;
  scenario: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
  relatedKeyPoint: number;
}

interface ExplainerData {
  sessionId: string;
  procedureName: string;
  doctorName: string;
  keyPoints: KeyPoint[];
  medicalTerms: MedicalTerm[];
  risks: RiskItem[];
  questions: QuizQuestion[];
}

interface VerifyResult {
  verificationId: string;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  results: {
    questionId: number;
    selectedId: string;
    correctId: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

interface CertificateData {
  id: string;
  patientName: string;
  procedureName: string;
  doctorName: string;
  score: number;
  passed: boolean;
  verifiedAt: string;
  sessionStarted: string;
  ipAddress: string;
  legalStatement: string;
}

type Step = 'name' | 'learn' | 'verify' | 'result';

export default function PatientPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [step, setStep] = useState<Step>('name');
  const [patientName, setPatientName] = useState('');
  const [data, setData] = useState<ExplainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Learn state
  const [currentPoint, setCurrentPoint] = useState(0);
  const [revealedPoints, setRevealedPoints] = useState<number[]>([]);
  const [showingTerm, setShowingTerm] = useState<string | null>(null);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<
    { questionId: number; selectedId: string }[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Result state
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  // Tooltip state for medical terms
  const [activeTooltip, setActiveTooltip] = useState<{
    term: MedicalTerm;
    x: number;
    y: number;
  } | null>(null);

  // Fetch explainer data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/explainer/${formId}`);
        if (!res.ok) throw new Error('Failed to load');
        const d = await res.json();
        setData(d);
      } catch {
        setError('Could not load consent information. Please check your link.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  // Reveal points one by one
  const revealNextPoint = useCallback(() => {
    if (!data) return;
    if (currentPoint < data.keyPoints.length) {
      setRevealedPoints((prev) => [...prev, currentPoint]);
      setCurrentPoint((prev) => prev + 1);
    }
  }, [currentPoint, data]);

  // Handle quiz answer
  const handleSelectOption = (optionId: string) => {
    if (showFeedback) return;
    setSelectedOption(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || !data) return;
    setShowFeedback(true);

    const q = data.questions[currentQuestion];
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, selectedId: selectedOption },
    ]);
  };

  const handleNextQuestion = () => {
    if (!data) return;
    setShowFeedback(false);
    setSelectedOption(null);

    if (currentQuestion + 1 < data.questions.length) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit all answers
      submitVerification();
    }
  };

  const submitVerification = async () => {
    if (!data) return;
    setVerifying(true);

    const finalAnswers = [...answers];
    // Include current (last) answer if not already added
    if (selectedOption && data.questions[currentQuestion]) {
      const lastQ = data.questions[currentQuestion];
      if (!finalAnswers.find((a) => a.questionId === lastQ.id)) {
        finalAnswers.push({ questionId: lastQ.id, selectedId: selectedOption });
      }
    }

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          patientName,
          answers: finalAnswers,
        }),
      });

      const result = await res.json();
      setVerifyResult(result);
      setStep('result');

      // Fetch certificate if passed
      if (result.passed) {
        const certRes = await fetch(
          `/api/certificate/${result.verificationId}`,
        );
        const certData = await certRes.json();
        setCertificate(certData.certificate);
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className='spinner' />
        <p style={{ color: 'var(--text-muted)' }}>
          Loading your consent information...
        </p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: 40,
        }}
      >
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ color: 'var(--accent-rose)', fontSize: 18 }}>
          {error || 'Something went wrong'}
        </p>
        <Link href='/' className='btn-secondary'>
          Go Home
        </Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛡️</span>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Clear<span className='gradient-text'>Consent</span>
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {data.procedureName} • Dr. {data.doctorName}
        </div>
      </nav>

      {/* STEP INDICATOR */}
      <div style={{ padding: '24px 24px 0', maxWidth: 640, margin: '0 auto' }}>
        <div className='step-indicator'>
          {['Your Name', 'Learn', 'Verify', 'Certificate'].map((label, i) => {
            const steps: Step[] = ['name', 'learn', 'verify', 'result'];
            const stepIdx = steps.indexOf(step);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flex: i < 3 ? 1 : undefined,
                }}
              >
                <div
                  className={`step-dot ${i === stepIdx ? 'active' : i < stepIdx ? 'completed' : ''}`}
                >
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: i === stepIdx ? 600 : 400,
                    color:
                      i === stepIdx
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    display: i === stepIdx ? 'block' : 'none',
                  }}
                >
                  {label}
                </span>
                {i < 3 && (
                  <div
                    className={`step-line ${i < stepIdx ? 'completed' : ''}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 640, margin: '32px auto', padding: '0 24px' }}>
        {/* STEP: NAME */}
        {step === 'name' && (
          <div className='animate-in'>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
              Welcome 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              {data.doctorName} has prepared an interactive explanation of your
              upcoming{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {data.procedureName}
              </strong>
              .
            </p>
            <p
              style={{
                color: 'var(--text-muted)',
                marginBottom: 32,
                fontSize: 14,
              }}
            >
              This will help you understand the procedure and its risks in
              simple terms — no medical degree needed!
            </p>

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
                Your Full Name
              </label>
              <input
                type='text'
                className='input-field'
                placeholder='Enter your full name'
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                autoFocus
              />
            </div>

            <button
              className='btn-primary'
              style={{ width: '100%' }}
              disabled={!patientName.trim()}
              onClick={() => setStep('learn')}
            >
              Start Learning →
            </button>
          </div>
        )}

        {/* STEP: LEARN */}
        {step === 'learn' && (
          <div className='animate-in'>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Understanding Your{' '}
              <span className='gradient-text'>{data.procedureName}</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 24,
                fontSize: 15,
              }}
            >
              {/* Show procedure summary from first key point */}
              Let&apos;s go through the key things you need to know. Tap each
              card to learn more.
            </p>

            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                }}
              >
                <span>
                  {revealedPoints.length} of {data.keyPoints.length} key points
                </span>
                <span>
                  {Math.round(
                    (revealedPoints.length / data.keyPoints.length) * 100,
                  )}
                  %
                </span>
              </div>
              <div className='progress-bar'>
                <div
                  className='progress-fill'
                  style={{
                    width: `${(revealedPoints.length / data.keyPoints.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Key Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {data.keyPoints.map((point, i) => (
                <div
                  key={i}
                  className='glass-card'
                  style={{
                    padding: '20px 24px',
                    opacity: revealedPoints.includes(i) ? 1 : 0.4,
                    cursor:
                      !revealedPoints.includes(i) && i === currentPoint
                        ? 'pointer'
                        : 'default',
                    transition: 'all 0.5s ease',
                  }}
                  onClick={() => {
                    if (i === currentPoint && !revealedPoints.includes(i)) {
                      revealNextPoint();
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0 }}>
                      {point.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {point.title}
                      </h3>
                      {revealedPoints.includes(i) && (
                        <div className='animate-in'>
                          <p
                            style={{
                              fontSize: 15,
                              color: 'var(--text-secondary)',
                              marginBottom: 10,
                            }}
                          >
                            {highlightMedicalTerms(
                              point.explanation,
                              data.medicalTerms,
                              (term, event) => {
                                if (!term) {
                                  setActiveTooltip(null);
                                  return;
                                }
                                const rect = (
                                  event!.target as HTMLElement
                                ).getBoundingClientRect();
                                setActiveTooltip({
                                  term,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10,
                                });
                              },
                            )}
                          </p>
                          <div
                            style={{
                              fontSize: 13,
                              color: 'var(--accent-cyan)',
                              background: 'rgba(6, 182, 212, 0.08)',
                              padding: '10px 14px',
                              borderRadius: 10,
                              borderLeft: '3px solid var(--accent-cyan)',
                            }}
                          >
                            💡 <em>Think of it like: {point.analogy}</em>
                          </div>
                        </div>
                      )}
                      {!revealedPoints.includes(i) && i === currentPoint && (
                        <p
                          style={{ fontSize: 13, color: 'var(--accent-blue)' }}
                        >
                          Tap to reveal →
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Risks Section */}
            {revealedPoints.length === data.keyPoints.length && (
              <div className='animate-in' style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  ⚠️ Risks to Know About
                </h3>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  {data.risks.map((risk, i) => (
                    <div
                      key={i}
                      className='glass-card'
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{risk.name}</span>
                          <span className={`risk-badge ${risk.likelihood}`}>
                            {risk.likelihood === 'rare' && 'Rare (unusual)'}
                            {risk.likelihood === 'uncommon' &&
                              'Uncommon (possible)'}
                            {risk.likelihood === 'common' &&
                              'Common (happens often)'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {highlightMedicalTerms(
                            risk.description,
                            data.medicalTerms,
                            (term, event) => {
                              if (!term) {
                                setActiveTooltip(null);
                                return;
                              }
                              const rect = (
                                event!.target as HTMLElement
                              ).getBoundingClientRect();
                              setActiveTooltip({
                                term,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                              });
                            },
                          )}
                        </p>
                      </div>
                      {/* Risk percentage (only if available) */}
                      {risk.likelihoodPercent != null && (
                        <div
                          style={{
                            width: 60,
                            textAlign: 'right',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color:
                                risk.likelihood === 'rare'
                                  ? 'var(--accent-emerald)'
                                  : risk.likelihood === 'uncommon'
                                    ? 'var(--accent-amber)'
                                    : 'var(--accent-rose)',
                            }}
                          >
                            {risk.likelihoodPercent}%
                          </div>
                          <div
                            style={{ fontSize: 11, color: 'var(--text-muted)' }}
                          >
                            chance
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Medical Terms now shown as inline tooltips - glossary removed */}

                {/* Continue to Quiz */}
                <button
                  className='btn-primary'
                  style={{ width: '100%', marginTop: 32, fontSize: 16 }}
                  onClick={() => setStep('verify')}
                >
                  I&apos;ve Read Everything — Let&apos;s Verify ✓
                </button>
              </div>
            )}

            {/* Reveal All shortcut */}
            {revealedPoints.length < data.keyPoints.length && (
              <button
                className='btn-secondary'
                style={{ width: '100%', marginTop: 20 }}
                onClick={() => {
                  setRevealedPoints(data.keyPoints.map((_, i) => i));
                  setCurrentPoint(data.keyPoints.length);
                }}
              >
                Reveal All Key Points
              </button>
            )}
          </div>
        )}

        {/* STEP: VERIFY */}
        {step === 'verify' && (
          <div className='animate-in'>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Let&apos;s Check Your Understanding 🧠
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Answer these {data.questions.length} quick scenarios to confirm
              you understand the key risks. Don&apos;t worry — this isn&apos;t a
              test, it&apos;s a conversation!
            </p>

            {/* Question progress */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              <span>
                Question {currentQuestion + 1} of {data.questions.length}
              </span>
            </div>
            <div className='progress-bar' style={{ marginBottom: 28 }}>
              <div
                className='progress-fill'
                style={{
                  width: `${((currentQuestion + 1) / data.questions.length) * 100}%`,
                }}
              />
            </div>

            {/* Question Card */}
            {data.questions[currentQuestion] && (
              <div key={currentQuestion} className='animate-in'>
                {/* Scenario */}
                <div
                  style={{
                    background: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    marginBottom: 16,
                    fontSize: 15,
                    color: 'var(--accent-blue-light)',
                    fontStyle: 'italic',
                  }}
                >
                  💭 {data.questions[currentQuestion].scenario}
                </div>

                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 20,
                  }}
                >
                  {data.questions[currentQuestion].question}
                </h3>

                {/* Options */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  {data.questions[currentQuestion].options.map((opt) => {
                    let cls = 'quiz-option';
                    if (showFeedback) {
                      if (
                        opt.id === data.questions[currentQuestion].correctId
                      ) {
                        cls += ' correct';
                      } else if (
                        opt.id === selectedOption &&
                        opt.id !== data.questions[currentQuestion].correctId
                      ) {
                        cls += ' incorrect';
                      }
                    } else if (opt.id === selectedOption) {
                      cls += ' selected';
                    }

                    return (
                      <div
                        key={opt.id}
                        className={cls}
                        onClick={() => handleSelectOption(opt.id)}
                      >
                        <div className='option-letter'>
                          {opt.id.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 15 }}>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback */}
                {showFeedback && (
                  <div
                    className='animate-in'
                    style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      marginBottom: 20,
                      background:
                        selectedOption ===
                        data.questions[currentQuestion].correctId
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(244, 63, 94, 0.1)',
                      border: `1px solid ${
                        selectedOption ===
                        data.questions[currentQuestion].correctId
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(244, 63, 94, 0.3)'
                      }`,
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        color:
                          selectedOption ===
                          data.questions[currentQuestion].correctId
                            ? 'var(--accent-emerald)'
                            : 'var(--accent-rose)',
                      }}
                    >
                      {selectedOption ===
                      data.questions[currentQuestion].correctId
                        ? '✅ Correct!'
                        : '❌ Not quite right'}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {data.questions[currentQuestion].explanation}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {!showFeedback ? (
                  <button
                    className='btn-primary'
                    style={{ width: '100%' }}
                    disabled={!selectedOption}
                    onClick={handleSubmitAnswer}
                  >
                    Check My Answer
                  </button>
                ) : (
                  <button
                    className='btn-primary'
                    style={{ width: '100%' }}
                    disabled={verifying}
                    onClick={handleNextQuestion}
                  >
                    {verifying ? (
                      <>
                        <div
                          className='spinner'
                          style={{ width: 20, height: 20, borderWidth: 2 }}
                        />
                        Verifying...
                      </>
                    ) : currentQuestion + 1 < data.questions.length ? (
                      'Next Question →'
                    ) : (
                      'Submit & Get Certificate ✓'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP: RESULT */}
        {step === 'result' && verifyResult && (
          <div className='animate-in'>
            {verifyResult.passed ? (
              <>
                {/* PASSED */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                  <h2
                    style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}
                  >
                    Understanding{' '}
                    <span className='gradient-text'>Verified!</span>
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                    You scored <strong>{verifyResult.score}%</strong> (
                    {verifyResult.correct}/{verifyResult.total} correct)
                  </p>
                </div>

                {/* Certificate */}
                {certificate && (
                  <div className='certificate'>
                    <div className='certificate-seal'>✓</div>
                    <h3
                      style={{
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      Verified Understanding Certificate
                    </h3>
                    <p
                      style={{
                        textAlign: 'center',
                        color: 'var(--accent-emerald)',
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 24,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                      }}
                    >
                      ClearConsent™ Audit Record
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px 24px',
                        marginBottom: 24,
                      }}
                    >
                      {[
                        { label: 'Patient', value: certificate.patientName },
                        {
                          label: 'Procedure',
                          value: certificate.procedureName,
                        },
                        {
                          label: 'Doctor',
                          value: `Dr. ${certificate.doctorName}`,
                        },
                        {
                          label: 'Comprehension Score',
                          value: `${certificate.score}%`,
                        },
                        {
                          label: 'Verified At',
                          value: new Date(
                            certificate.verifiedAt,
                          ).toLocaleString(),
                        },
                        {
                          label: 'Certificate ID',
                          value: certificate.id.substring(0, 8) + '...',
                        },
                      ].map((item, i) => (
                        <div key={i}>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: 1,
                              marginBottom: 4,
                            }}
                          >
                            {item.label}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                        paddingTop: 16,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ color: 'var(--text-secondary)' }}>
                        Legal Statement:
                      </strong>{' '}
                      {certificate.legalStatement}
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                      }}
                    >
                      IP: {certificate.ipAddress} • Session:{' '}
                      {certificate.sessionStarted}
                    </div>
                  </div>
                )}

                {/* Comparison */}
                <div
                  style={{
                    marginTop: 32,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                  }}
                >
                  <div
                    className='glass-card'
                    style={{
                      padding: 20,
                      borderColor: 'rgba(244, 63, 94, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--accent-rose)',
                      }}
                    >
                      Old Way
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Check box on 10-page legal PDF
                      <br />
                      No proof of understanding
                      <br />
                      Weak legal defense
                    </p>
                  </div>
                  <div
                    className='glass-card'
                    style={{
                      padding: 20,
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 8,
                        color: 'var(--accent-emerald)',
                      }}
                    >
                      ClearConsent
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Interactive learning experience
                      <br />
                      Verified {certificate?.score}% comprehension
                      <br />
                      Legally defensible audit trail
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* FAILED */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                  <h2
                    style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}
                  >
                    Let&apos;s Review Together
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
                    You scored {verifyResult.score}% — let&apos;s go through the
                    material again to make sure you understand everything.
                  </p>
                </div>

                <button
                  className='btn-primary'
                  style={{ width: '100%', marginBottom: 16 }}
                  onClick={() => {
                    setStep('learn');
                    setCurrentPoint(0);
                    setRevealedPoints([]);
                    setCurrentQuestion(0);
                    setAnswers([]);
                    setSelectedOption(null);
                    setShowFeedback(false);
                    setVerifyResult(null);
                  }}
                >
                  📖 Review the Material Again
                </button>
              </>
            )}

            <Link
              href='/'
              className='btn-secondary'
              style={{
                width: '100%',
                textAlign: 'center',
                display: 'block',
                marginTop: 16,
              }}
            >
              Return Home
            </Link>
          </div>
        )}
      </div>

      {/* Medical Term Tooltip */}
      {activeTooltip && (
        <div
          style={{
            position: 'fixed',
            left: activeTooltip.x,
            top: activeTooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: 12,
            padding: '16px 20px',
            maxWidth: 320,
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            animation: 'fadeInUp 0.2s ease',
            pointerEvents: 'none', // Don't block mouse events
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              fontSize: 15,
              marginBottom: 8,
            }}
          >
            {activeTooltip.term.term}
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginBottom: 8,
              lineHeight: 1.5,
            }}
          >
            {activeTooltip.term.definition}
          </p>
          <div
            style={{
              fontSize: 13,
              color: 'var(--accent-blue-light)',
              fontStyle: 'italic',
              padding: '8px 12px',
              background: 'rgba(59, 130, 246, 0.06)',
              borderLeft: '3px solid var(--accent-blue)',
              borderRadius: 6,
            }}
          >
            💡 {activeTooltip.term.simpleAnalogy}
          </div>
        </div>
      )}
    </main>
  );
}
