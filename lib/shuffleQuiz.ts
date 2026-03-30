/**
 * Shuffles quiz options to prevent pattern-matching
 * Updates correctId to track the correct answer after shuffling
 */
export function shuffleQuizOptions(questions: any[]): any[] {
  return questions.map((q) => {
    const options = [...q.options];
    const correctOption = options.find((opt) => opt.id === q.correctId);

    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Update correctId after shuffling
    const newCorrectId = correctOption ? correctOption.id : q.correctId;

    return {
      ...q,
      options,
      correctId: newCorrectId,
    };
  });
}
