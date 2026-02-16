import React from 'react';

interface MedicalTerm {
  term: string;
  definition: string;
  simpleAnalogy: string;
}

/**
 * Highlights medical terms in text by replacing them with hoverable spans
 * Returns React nodes with interactive term highlights that show tooltips on hover
 */
export function highlightMedicalTerms(
  text: string,
  terms: MedicalTerm[],
  onTermHover: (term: MedicalTerm | null, event?: React.MouseEvent) => void,
): React.ReactNode[] {
  if (!terms || terms.length === 0) return [text];

  // Sort terms by length (longest first) to avoid partial matches
  const sortedTerms = [...terms].sort((a, b) => b.term.length - a.term.length);

  // Build a regex that matches any term (case-insensitive, whole word)
  const termPattern = sortedTerms
    .map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // escape regex chars
    .join('|');

  if (!termPattern) return [text];

  const regex = new RegExp(`\\b(${termPattern})\\b`, 'gi');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Find the term definition
    const matchedText = match[0];
    const term = sortedTerms.find(
      (t) => t.term.toLowerCase() === matchedText.toLowerCase(),
    );

    if (term) {
      parts.push(
        <span
          key={match.index}
          className='medical-term-highlight'
          onMouseEnter={(e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            onTermHover(term, e);
          }}
          onMouseLeave={() => {
            onTermHover(null);
          }}
        >
          {matchedText}
        </span>,
      );
    } else {
      parts.push(matchedText);
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
