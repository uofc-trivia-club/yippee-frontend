import { QuizQuestion } from "../../../stores/types";

const normalizeText = (value: string) => value.trim().toLowerCase();

const sortNormalized = (values: string[]) => [...values].map(normalizeText).sort();

const levenshteinDistance = (left: string, right: string): number => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1).fill(0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost,
      );
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
};

const isFuzzyMatch = (submitted: string, accepted: string, threshold: number = 0.85): boolean => {
  const maxLength = Math.max(submitted.length, accepted.length);
  if (!maxLength) return true;

  const distance = levenshteinDistance(submitted, accepted);
  const similarity = 1 - distance / maxLength;
  return similarity >= threshold;
};

const compareAsSets = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  const normalizedLeft = sortNormalized(left);
  const normalizedRight = sortNormalized(right);
  return normalizedLeft.every((value, index) => value === normalizedRight[index]);
};

const parseKeyValueEntries = (entries: string[]) => {
  const map: Record<string, string> = {};
  entries.forEach((entry) => {
    const raw = String(entry || '').trim();
    if (!raw) return;

    const separators = [':', '=', '->'];
    let splitIndex = -1;
    let separatorLength = 1;
    for (const separator of separators) {
      const index = raw.indexOf(separator);
      if (index > 0) {
        splitIndex = index;
        separatorLength = separator.length;
        break;
      }
    }
    if (splitIndex <= 0) return;

    const key = normalizeText(raw.slice(0, splitIndex));
    const value = normalizeText(raw.slice(splitIndex + separatorLength));
    if (key && value) {
      map[key] = value;
    }
  });
  return map;
};

export const getQuestionTypeTitle = (typeName?: string) => {
  switch (typeName) {
    case 'multiple_choice': return 'Multiple-choice question';
    case 'multi_select': return 'Multi-select question';
    case 'dropdown': return 'Dropdown question';
    case 'true_false': return 'True/false question';
    case 'short_answer': return 'Short-answer question';
    case 'fill_in_blank': return 'Fill-in-the-blank question';
    case 'numerical': return 'Numerical question';
    case 'match_the_phrase': return 'Match-the-phrase question';
    case 'matching': return 'Matching question';
    case 'ranking': return 'Ranking question';
    case 'ordering': return 'Ranking question';
    case 'image_based': return 'Image-based question';
    case 'calendar': return 'Calendar question';
    case 'essay': return 'Essay question';
    default: return 'Question';
  }
};

export const isAnswerCorrectFor = (question: QuizQuestion | undefined, submitted: string[]) => {
  const type = question?.type;

  if (!question || !type || submitted.length === 0) return false;

  switch (type.name) {
    case 'multiple_choice':
      return submitted[0]
        ? normalizeText(submitted[0]) === normalizeText((type as any).correctAnswer || question.correctAnswers?.[0] || '')
        : false;

    case 'multi_select':
    case 'image_based': {
      const accepted = (question.correctAnswers || (type as any).correctAnswers || []) as string[];
      return compareAsSets(submitted, accepted);
    }

    case 'dropdown':
    case 'true_false':
      return submitted[0]
        ? normalizeText(submitted[0]) === normalizeText((type as any).correctAnswer || question.correctAnswers?.[0] || '')
        : false;

    case 'short_answer': {
      const accepted = ((question.correctAnswers || (type as any).correctAnswers || []) as string[]).map(normalizeText);
      const submittedNormalized = normalizeText(submitted[0] || '');
      return accepted.some((answer: string) =>
        answer === submittedNormalized || isFuzzyMatch(submittedNormalized, answer)
      );
    }

    case 'fill_in_blank': {
      const blankCount = Math.max(1, question.question.split('____').length - 1);
      const groupedAccepted = (question.correctAnswers || (type as any).correctAnswers || []) as string[];
      const submittedTrimmed = submitted.slice(0, blankCount).map((s) => normalizeText(s || ''));
      if (submittedTrimmed.length < blankCount || submittedTrimmed.some((s) => !s)) return false;

      return submittedTrimmed.every((value, index) => {
        const rawAccepted = groupedAccepted[index] || '';
        const acceptedValues = rawAccepted
          .split('|')
          .map((v) => normalizeText(v))
          .filter(Boolean);
        if (!acceptedValues.length) {
          const fallback = normalizeText(groupedAccepted[index] || '');
          return fallback ? fallback === value || isFuzzyMatch(value, fallback) : false;
        }
        return acceptedValues.some(accepted => accepted === value || isFuzzyMatch(value, accepted));
      });
    }

    case 'numerical': {
      const expected = Number((type as any).correctAnswer);
      const actual = Number(submitted[0]);
      return Number.isFinite(expected) && Number.isFinite(actual) && actual === expected;
    }

    case 'essay':
      return false;

    case 'match_the_phrase': {
      const typeAny = type as any;
      const fromMap = typeAny.correctAssign && typeof typeAny.correctAssign === 'object' && !Array.isArray(typeAny.correctAssign)
        ? Object.entries(typeAny.correctAssign as Record<string, string>).map(([slotId, value]) => `${slotId}:${value}`)
        : [];

      const slotIds = ((typeAny.slots || typeAny.blanks || []) as string[])
        .map((slot) => String(slot || '').trim())
        .filter(Boolean);
      const orderedAnswers = (
        Array.isArray(typeAny.correct) ? typeAny.correct
        : Array.isArray(typeAny.correctAnswers) ? typeAny.correctAnswers
        : Array.isArray(question.correctAnswers) ? question.correctAnswers
        : []
      ) as string[];

      const fromOrdered = slotIds.length > 0 && orderedAnswers.length > 0
        ? slotIds
            .map((slotId, index) => {
              const value = String(orderedAnswers[index] || '').trim();
              return slotId && value ? `${slotId}:${value}` : '';
            })
            .filter(Boolean)
        : [];

      const fromLegacyPairs = (Array.isArray(question.correctAnswers) ? question.correctAnswers : [])
        .map((entry) => String(entry || '').trim())
        .filter((entry) => entry.includes(':'));

      const accepted = fromMap.length > 0
        ? fromMap
        : (fromOrdered.length > 0 ? fromOrdered : fromLegacyPairs);

      const expectedMap = parseKeyValueEntries(accepted);
      const submittedMapFromPairs = parseKeyValueEntries(submitted);

      const submittedMap = Object.keys(submittedMapFromPairs).length > 0
        ? submittedMapFromPairs
        : (slotIds.length > 0
            ? Object.fromEntries(
                submitted
                  .slice(0, slotIds.length)
                  .map((value, index) => [normalizeText(slotIds[index] || ''), normalizeText(String(value || ''))])
                  .filter(([key, value]) => Boolean(key) && Boolean(value))
              )
            : {});

      const expectedKeys = Object.keys(expectedMap);
      if (expectedKeys.length === 0) {
        return compareAsSets(submitted, accepted);
      }

      if (Object.keys(submittedMap).length !== expectedKeys.length) return false;
      return expectedKeys.every((key) => submittedMap[key] === expectedMap[key]);
    }

    case 'matching': {
      const typeAny = type as any;
      const fromMap = typeAny.correctMatches && typeof typeAny.correctMatches === 'object'
        ? Object.entries(typeAny.correctMatches as Record<string, string>).map(([left, right]) => `${left}:${right}`)
        : [];
      const fromPairs = Array.isArray(typeAny.pairs)
        ? (typeAny.pairs as Array<{ left?: string; right?: string; leftItem?: string; rightItem?: string }>)
            .map((pair) => {
              const left = (pair.left || pair.leftItem || '').trim();
              const right = (pair.right || pair.rightItem || '').trim();
              return left && right ? `${left}:${right}` : '';
            })
            .filter(Boolean)
        : [];
      const legacy = Array.isArray(question.correctAnswers) ? question.correctAnswers : [];
      const correct = fromMap.length > 0 ? fromMap : (fromPairs.length > 0 ? fromPairs : legacy);
      return compareAsSets(submitted, correct);
    }

    case 'ranking':
    case 'ordering': {
      const correctOrder = ((type as any).correctOrder || question.correctAnswers || []) as string[];
      return submitted.length === correctOrder.length && submitted.every((value, index) => normalizeText(value) === normalizeText(correctOrder[index] || ''));
    }

    case 'calendar': {
      const correctDates = (question.correctAnswers || (type as any).correctAnswers || []) as string[];
      if (submitted.length === 0 || correctDates.length === 0) return false;
      const submittedNormalized = new Set(submitted.map((d) => d.trim()).sort());
      const correctNormalized = new Set(correctDates.map((d) => d.trim()).sort());
      if (submittedNormalized.size !== correctNormalized.size) return false;
      return Array.from(submittedNormalized).every((date) => correctNormalized.has(date));
    }

    default:
      return false;
  }
};