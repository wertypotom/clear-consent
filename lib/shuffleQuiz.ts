const OPTION_IDS = ['a', 'b', 'c', 'd'];

/**
 * Shuffles quiz questions and option content.
 * Options always render in a/b/c/d order — only the content rotates.
 * correctId is updated to reflect the new position of the correct answer.
 */
export function shuffleQuizOptions(questions: any[]): any[] {
  // 1. Shuffle question order
  const shuffledQuestions = [...questions];
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledQuestions[i], shuffledQuestions[j]] = [
      shuffledQuestions[j],
      shuffledQuestions[i],
    ];
  }

  // 2. For each question, shuffle option *content* but keep a/b/c/d positions stable
  return shuffledQuestions.map((q) => {
    // Extract just the text content, find which text is correct
    const texts = q.options.map((o: any) => o.text);
    const correctText = q.options.find((o: any) => o.id === q.correctId)?.text;

    // Fisher-Yates shuffle on texts
    for (let i = texts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [texts[i], texts[j]] = [texts[j], texts[i]];
    }

    // Reassign stable a/b/c/d ids to shuffled texts
    const newOptions = texts.map((text: string, idx: number) => ({
      id: OPTION_IDS[idx],
      text,
    }));

    // Find the new id of the correct answer by matching text
    const newCorrectId =
      newOptions.find((o: any) => o.text === correctText)?.id ?? q.correctId;

    return { ...q, options: newOptions, correctId: newCorrectId };
  });
}

