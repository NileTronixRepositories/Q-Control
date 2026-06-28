import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorItem {
  readonly message?: string | null;
}

interface ApiErrorBody {
  readonly title?: string | null;
  readonly detail?: string | null;
  readonly traceId?: string | null;
  readonly errors?: readonly ApiErrorItem[] | null;
}

const MAX_TOAST_ERROR_LENGTH = 220;

export function formatTechnicalAdminApiError(
  error: HttpErrorResponse,
  fallbackMessage: string,
): string {
  const rawMessage = extractRawApiMessage(error.error);
  const normalizedMessage = sanitizeApiMessage(rawMessage);

  if (normalizedMessage) {
    return normalizedMessage;
  }

  return fallbackMessage;
}

function extractRawApiMessage(errorBody: unknown): string | null {
  if (typeof errorBody === 'string') {
    return errorBody;
  }

  if (!isApiErrorBody(errorBody)) {
    return null;
  }

  const firstError = errorBody.errors?.find((item) => item.message?.trim().length);

  return firstError?.message ?? errorBody.detail ?? errorBody.title ?? null;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}

function sanitizeApiMessage(message: string | null): string | null {
  if (!message?.trim()) {
    return null;
  }

  const normalized = message.replace(/\s+/g, ' ').trim();
  const withoutExceptionPrefix = normalized.replace(
    /^(?:[A-Za-z0-9_.]+Exception)(?:\s*\([^)]*\))?:\s*/,
    '',
  );
  const stackStart = findStackStart(withoutExceptionPrefix);
  const withoutStack = stackStart >= 0
    ? withoutExceptionPrefix.slice(0, stackStart).trim()
    : withoutExceptionPrefix;
  const withoutTrace = withoutStack
    .replace(/\s*ClientConnectionId:[^ ]+(?:\s.*)?$/i, '')
    .replace(/\s*Error Number:\d+(?:\s.*)?$/i, '')
    .trim();

  if (!withoutTrace) {
    return null;
  }

  return truncateMessage(withoutTrace);
}

function findStackStart(message: string): number {
  const markers = [
    ' at System.',
    ' at Microsoft.',
    ' at BuildingBlock.',
    ' at Qcontrol.',
    ' --- End of stack trace',
    ' in E:',
    ' in C:',
  ];
  const indexes = markers
    .map((marker) => message.indexOf(marker))
    .filter((index) => index >= 0);

  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

function truncateMessage(message: string): string {
  if (message.length <= MAX_TOAST_ERROR_LENGTH) {
    return message;
  }

  const sentenceEnd = message.lastIndexOf('.', MAX_TOAST_ERROR_LENGTH);
  const endIndex = sentenceEnd > 80 ? sentenceEnd + 1 : MAX_TOAST_ERROR_LENGTH;

  return `${message.slice(0, endIndex).trim()}...`;
}