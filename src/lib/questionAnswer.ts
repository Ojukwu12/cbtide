export const ANSWER_CHOICES = ['A', 'B', 'C', 'D'] as const;
export type AnswerChoice = (typeof ANSWER_CHOICES)[number];

const normalizeToken = (value: unknown): string => String(value || '').trim().toLowerCase();

export const toAnswerChoice = (value: unknown): AnswerChoice | null => {
  const upper = String(value || '').trim().toUpperCase();
  if (ANSWER_CHOICES.includes(upper as AnswerChoice)) {
    return upper as AnswerChoice;
  }
  return null;
};

export const buildOptionMeta = (
  question: any
): { choiceText: Record<AnswerChoice, string>; aliasToChoice: Map<string, AnswerChoice> } => {
  const choiceText: Record<AnswerChoice, string> = {
    A: '',
    B: '',
    C: '',
    D: '',
  };
  const aliasToChoice = new Map<string, AnswerChoice>();

  const assign = (choice: AnswerChoice, text: string, aliases: Array<unknown>) => {
    const normalizedText = String(text || '').trim();
    if (normalizedText) {
      choiceText[choice] = normalizedText;
    }

    aliases.forEach((alias) => {
      const token = normalizeToken(alias);
      if (token) {
        aliasToChoice.set(token, choice);
      }
    });

    const textToken = normalizeToken(normalizedText);
    if (textToken) {
      aliasToChoice.set(textToken, choice);
    }
  };

  const options = question?.options;

  if (Array.isArray(options)) {
    options.forEach((option: any, index: number) => {
      const derivedChoice =
        toAnswerChoice(option?.id || option?._id || option?.option) ||
        (ANSWER_CHOICES[index] as AnswerChoice | undefined);
      if (!derivedChoice) return;

      const text = String(option?.text || option?.value || option?.label || '');
      assign(derivedChoice, text, [option?.id, option?._id, option?.option]);
    });
    return { choiceText, aliasToChoice };
  }

  if (options && typeof options === 'object') {
    let fallbackIndex = 0;

    Object.entries(options).forEach(([key, value]) => {
      let derivedChoice: AnswerChoice | undefined = toAnswerChoice(key) ?? undefined;
      if (!derivedChoice) {
        derivedChoice = ANSWER_CHOICES[fallbackIndex];
        fallbackIndex += 1;
      }
      if (!derivedChoice) return;

      const text =
        value && typeof value === 'object'
          ? String((value as any).text || (value as any).value || '')
          : String(value || '');

      const aliases =
        value && typeof value === 'object'
          ? [key, (value as any).id, (value as any)._id, (value as any).option]
          : [key];

      assign(derivedChoice, text, aliases);
    });
  }

  const legacyOptionCandidates: Record<AnswerChoice, Array<unknown>> = {
    A: [question?.optionA, question?.option_a, question?.a, question?.choiceA, question?.choice_a],
    B: [question?.optionB, question?.option_b, question?.b, question?.choiceB, question?.choice_b],
    C: [question?.optionC, question?.option_c, question?.c, question?.choiceC, question?.choice_c],
    D: [question?.optionD, question?.option_d, question?.d, question?.choiceD, question?.choice_d],
  };

  ANSWER_CHOICES.forEach((choice) => {
    if (choiceText[choice]) return;

    const value = legacyOptionCandidates[choice].find((entry) => {
      const text = String(entry ?? '').trim();
      return text.length > 0;
    });

    if (value !== undefined) {
      const text = String(value).trim();
      assign(choice, text, [choice, choice.toLowerCase()]);
    }
  });

  return { choiceText, aliasToChoice };
};

export const resolveCorrectAnswerChoice = (question: any): AnswerChoice | null => {
  const options = question?.options;

  if (Array.isArray(options)) {
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const isMarkedCorrect = Boolean(option?.isCorrect ?? option?.correct ?? option?.is_correct ?? option?.isAnswerCorrect);
      if (!isMarkedCorrect) continue;

      const derivedChoice =
        toAnswerChoice(option?.id || option?._id || option?.option) ||
        (ANSWER_CHOICES[index] as AnswerChoice | undefined);

      if (derivedChoice) return derivedChoice;
    }
  }

  if (options && typeof options === 'object' && !Array.isArray(options)) {
    let fallbackIndex = 0;
    for (const [key, value] of Object.entries(options)) {
      const option = value as any;
      const isMarkedCorrect = Boolean(option?.isCorrect ?? option?.correct ?? option?.is_correct ?? option?.isAnswerCorrect);
      if (!isMarkedCorrect) {
        fallbackIndex += 1;
        continue;
      }

      const derivedChoice =
        toAnswerChoice(key) ||
        toAnswerChoice(option?.id || option?._id || option?.option) ||
        (ANSWER_CHOICES[fallbackIndex] as AnswerChoice | undefined);

      if (derivedChoice) return derivedChoice;
      fallbackIndex += 1;
    }
  }

  const candidateValues = [
    question?.correctAnswer,
    question?.correct_answer,
    question?.correctanswer,
    question?.correct_option,
    question?.correctOption,
    question?.correctAnswerIndex,
    question?.correctOptionIndex,
    question?.correctIndex,
    question?.answer_index,
    question?.answerIndex,
    question?.answerKey,
    question?.answer_key,
    question?.answer,
    question?.correct,
    question?.rightAnswer,
    question?.right_answer,
    question?.expectedAnswer,
    question?.solution,
  ];

  const { aliasToChoice } = buildOptionMeta(question);

  const resolveFromValue = (value: unknown): AnswerChoice | null => {
    if (value === undefined || value === null) return null;

    const direct = toAnswerChoice(value);
    if (direct) return direct;

    if (typeof value === 'number' && Number.isFinite(value)) {
      const asOneBased = ANSWER_CHOICES[value - 1];
      if (asOneBased) return asOneBased;

      const asZeroBased = ANSWER_CHOICES[value];
      if (asZeroBased) return asZeroBased;
    }

    if (typeof value === 'object') {
      const nestedObject = value as any;
      const nestedCandidates = [nestedObject.id, nestedObject._id, nestedObject.option, nestedObject.value, nestedObject.text, nestedObject.label];
      for (const nested of nestedCandidates) {
        const resolvedNested = resolveFromValue(nested);
        if (resolvedNested) return resolvedNested;
      }
      return null;
    }

    const rawString = String(value || '').trim();
    if (!rawString) return null;

    const leadingChoiceMatch = rawString.match(/^\s*([A-D])(?:\b|\s*[\).:-])/i);
    if (leadingChoiceMatch?.[1]) {
      const matchedChoice = toAnswerChoice(leadingChoiceMatch[1]);
      if (matchedChoice) return matchedChoice;
    }

    const normalizedRaw = normalizeToken(rawString);
    if (aliasToChoice.has(normalizedRaw)) {
      return aliasToChoice.get(normalizedRaw) || null;
    }

    const compact = normalizedRaw.replace(/[^a-z0-9]/g, '');
    if (compact.startsWith('option') && compact.length > 6) {
      const optionLetter = compact.slice(6, 7).toUpperCase();
      const optionChoice = toAnswerChoice(optionLetter);
      if (optionChoice) return optionChoice;
    }

    if (compact === '1' || compact === '2' || compact === '3' || compact === '4') {
      return ANSWER_CHOICES[Number(compact) - 1] || null;
    }

    return null;
  };

  for (const candidate of candidateValues) {
    const resolved = resolveFromValue(candidate);
    if (resolved) return resolved;
  }

  return null;
};

export const hasMissingCorrectAnswer = (question: any): boolean => {
  return resolveCorrectAnswerChoice(question) === null;
};

export const getNormalizedAnswerOptions = (question: any): Array<{ id: AnswerChoice; text: string }> => {
  const { choiceText } = buildOptionMeta(question);
  return ANSWER_CHOICES.filter((choice) => String(choiceText[choice]).trim().length > 0).map((choice) => ({
    id: choice,
    text: choiceText[choice],
  }));
};
