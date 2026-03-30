'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const createDemo = async () => {
      try {
        // Create a demo consent form with sample text
        const sampleConsentText = `
INFORMED CONSENT FOR TOTAL KNEE REPLACEMENT SURGERY (Total Knee Arthroplasty)

Patient Name: ______________________  Date: ____________
Surgeon: Dr. Sarah Johnson, M.D. - Orthopedic Surgery

PROCEDURE DESCRIPTION:
Total Knee Replacement (Total Knee Arthroplasty) is a surgical procedure in which the damaged knee joint is replaced with artificial components (prosthesis). The procedure involves removing the damaged cartilage and bone from the knee joint and replacing it with metal and plastic components.

The surgery is performed under general or regional anesthesia (spinal or epidural). An incision of approximately 8-12 inches is made over the knee. The damaged bone and cartilage are removed, and the artificial joint is cemented or press-fit into place. The surgery typically takes 1.5-3 hours.

INDICATION:
This procedure is recommended due to severe osteoarthritis causing significant pain, stiffness, and limited mobility that has not responded adequately to conservative treatments including physical therapy, medications, and injections.

RISKS AND COMPLICATIONS:
1. INFECTION (2-3% risk): Despite sterile technique and prophylactic antibiotics, infection can occur at the surgical site or around the prosthesis. Deep infection may require additional surgery, prolonged antibiotic therapy, or in severe cases, removal of the prosthesis.

2. BLOOD CLOTS / DEEP VEIN THROMBOSIS (5-10% risk): Blood clots can form in the leg veins (DVT) after surgery. In rare cases (less than 1%), these clots can travel to the lungs (pulmonary embolism), which can be life-threatening. Blood thinning medications will be prescribed to reduce this risk.

3. NERVE DAMAGE (1-2% risk): Nerves around the knee may be stretched or damaged during surgery, potentially causing numbness, tingling, or weakness in the leg or foot. Most nerve injuries improve over time, but some may be permanent.

4. IMPLANT FAILURE/LOOSENING (5-10% over 15 years): The artificial joint may loosen over time, wear out, or fail. This may require revision surgery to replace the prosthesis. Factors that increase this risk include obesity, high-impact activities, and younger age at time of surgery.

5. STIFFNESS / LIMITED RANGE OF MOTION: The knee may not achieve full range of motion after surgery. Physical therapy is essential, and in some cases, manipulation under anesthesia may be required.

6. ALLERGIC REACTION (rare): Allergic reactions to anesthesia, medications, or implant materials (metals) may occur.

7. CHRONIC PAIN: While most patients experience significant pain relief, a small percentage (10-15%) may continue to experience chronic pain after surgery.

8. GENERAL SURGICAL RISKS: Bleeding requiring transfusion, reaction to anesthesia, heart attack, stroke, or death (very rare, less than 0.5%).

ALTERNATIVES:
- Continued conservative management (physical therapy, medications, injections)
- Arthroscopic surgery (less invasive but limited effectiveness)
- Partial knee replacement (if damage is limited to one compartment)
- Osteotomy (bone realignment)

EXPECTED OUTCOMES:
- Significant pain relief in 90-95% of patients
- Improved mobility and function
- Prosthesis lifespan of 15-20+ years
- Full recovery period of 3-6 months

POST-OPERATIVE REQUIREMENTS:
- Hospital stay of 1-3 days
- Physical therapy beginning day of or day after surgery
- Blood thinning medication for 2-6 weeks
- No driving for 4-6 weeks
- Return to most activities in 6-12 weeks
- Avoid high-impact activities permanently

By signing below, I acknowledge that I have read this document, that the procedure, risks, benefits, and alternatives have been explained to me, and that I consent to undergo the procedure.
`;

        const formData = new FormData();
        const blob = new Blob([sampleConsentText], { type: 'text/plain' });
        formData.append('pdf', blob, 'knee-replacement-consent.txt');
        formData.append('doctorName', 'Sarah Johnson');
        formData.append('procedureName', 'Total Knee Replacement Surgery');

        const res = await fetch('/api/upload-consent', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Demo creation failed');
        }

        const data = await res.json();
        router.push(`/patient/${data.formId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create demo');
        setLoading(false);
      }
    };

    createDemo();
  }, [router]);

  if (error) {
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
        <p style={{ color: 'var(--accent-rose)', fontSize: 18 }}>{error}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Make sure ABACUS_API_KEY and ABACUS_API_URL are set in your .env.local
          file
        </p>
      </main>
    );
  }

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
      <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
        Creating demo with sample knee surgery consent...
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
        AI is generating your interactive explainer 🤖
      </p>
    </main>
  );
}
