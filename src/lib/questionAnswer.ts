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

  return { choiceText, aliasToChoice };
};

export const resolveCorrectAnswerChoice = (question: any): AnswerChoice | null => {
  const raw = question?.correctAnswer;
  if (raw === undefined || raw === null) return null;

  const direct = toAnswerChoice(raw);
  if (direct) return direct;

  const normalizedRaw = normalizeToken(raw);
  if (!normalizedRaw) return null;

  const { aliasToChoice } = buildOptionMeta(question);
  return aliasToChoice.get(normalizedRaw) || null;
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
