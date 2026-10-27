import { AppLanguage } from '../models/app-language/app-language.model';

export interface BilingualPair {
  readonly ar: string;
  readonly en: string;
}

/**
 * Universal bilingual toast message dictionary for Q-SYSTEM.
 * Maps common backend API strings, success responses, and error codes
 * seamlessly between Arabic and English.
 */
export const BILINGUAL_TOAST_ENTRIES: readonly BilingualPair[] = [
  // Brand & Identity
  {
    ar: 'تم رفع شعار الفرع بنجاح.',
    en: 'Branch logo uploaded successfully.',
  },
  {
    ar: 'تم حفظ إعدادات الهوية البصرية والتصميم بنجاح.',
    en: 'Visual identity and layout settings saved successfully.',
  },
  {
    ar: 'تم حفظ إعدادات الهوية العامة بنجاح.',
    en: 'General branding settings saved successfully.',
  },
  {
    ar: 'تم رفع الإعلانات بنجاح.',
    en: 'Advertisements uploaded successfully.',
  },
  {
    ar: 'تم حفظ ترتيب الإعلانات بنجاح.',
    en: 'Advertisement display order saved successfully.',
  },
  {
    ar: 'تم تحديث حالة الإعلان بنجاح.',
    en: 'Advertisement status updated successfully.',
  },
  {
    ar: 'تم حذف الإعلان بنجاح.',
    en: 'Advertisement deleted successfully.',
  },
  {
    ar: 'لا يوجد شعار مرفوع لهذا الفرع.',
    en: 'No logo has been uploaded for this branch.',
  },

  // Common CRUD & Operations
  {
    ar: 'تم حفظ الإعدادات بنجاح.',
    en: 'Settings saved successfully.',
  },
  {
    ar: 'تم حفظ البيانات بنجاح.',
    en: 'Data saved successfully.',
  },
  {
    ar: 'تم الحفظ بنجاح.',
    en: 'Saved successfully.',
  },
  {
    ar: 'تم تعديل البيانات بنجاح.',
    en: 'Data updated successfully.',
  },
  {
    ar: 'تم التحديث بنجاح.',
    en: 'Updated successfully.',
  },
  {
    ar: 'تمت العملية بنجاح.',
    en: 'Operation completed successfully.',
  },
  {
    ar: 'تم إنشاء العنصر بنجاح.',
    en: 'Item created successfully.',
  },
  {
    ar: 'تم حذف العنصر بنجاح.',
    en: 'Item deleted successfully.',
  },
  {
    ar: 'تم الحذف بنجاح.',
    en: 'Deleted successfully.',
  },

  // Service & Branch Management
  {
    ar: 'تم إنشاء الخدمة بنجاح.',
    en: 'Service created successfully.',
  },
  {
    ar: 'تم تعديل الخدمة بنجاح.',
    en: 'Service updated successfully.',
  },
  {
    ar: 'تم حذف الخدمة بنجاح.',
    en: 'Service deleted successfully.',
  },
  {
    ar: 'تم تعيين جدول المواعيد بنجاح.',
    en: 'Schedule assigned successfully.',
  },
  {
    ar: 'تم حفظ إعدادات الشاشة بنجاح.',
    en: 'Display configuration saved successfully.',
  },
  {
    ar: 'تم حفظ إعدادات الشباك بنجاح.',
    en: 'Window configuration saved successfully.',
  },
  {
    ar: 'تم حفظ إعدادات الجهاز الطرفي بنجاح.',
    en: 'Terminal configuration saved successfully.',
  },
  {
    ar: 'تم إصدار التذكرة بنجاح.',
    en: 'Ticket issued successfully.',
  },

  // Errors & Concurrency
  {
    ar: 'تم تعديل البيانات بواسطة مستخدم آخر. تم إعادة جلب البيانات برجاء المراجعة والحفظ مجدداً.',
    en: 'The data was modified by another user. Latest data loaded, please review and save again.',
  },
  {
    ar: 'حدث تعارض في البيانات مع مستخدم آخر. يرجى إعادة المحاولة.',
    en: 'A concurrency conflict occurred. Please reload and try again.',
  },
  {
    ar: 'العنصر المطلوب غير موجود أو تم حذفه.',
    en: 'The requested item was not found or has been removed.',
  },
  {
    ar: 'الفرع المطلوب غير موجود.',
    en: 'The requested branch was not found.',
  },
  {
    ar: 'الخدمة المطلوبة غير موجودة.',
    en: 'The requested service was not found.',
  },
  {
    ar: 'انتهت صلاحية الجلسة أو ليس لديك الصلاحية لتنفيذ هذا الإجراء.',
    en: 'Session expired or you do not have permission for this action.',
  },
  {
    ar: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.',
    en: 'Unable to reach the server. Please check your internet connection.',
  },
  {
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    en: 'An unexpected error occurred. Please try again.',
  },
  {
    ar: 'حدث خطأ غير متوقع.',
    en: 'Unexpected error occurred.',
  },
  {
    ar: 'نوع الملف غير مدعوم.',
    en: 'Unsupported file type.',
  },
  {
    ar: 'حجم الملف يتجاوز الحد المسموح به.',
    en: 'File size exceeds the allowed limit.',
  },
];

/**
 * Normalizes text for matching by trimming whitespace and punctuation.
 */
function normalizeForMatch(text: string): string {
  return text
    .trim()
    .replace(/[.،!؟]+$/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Localizes any toast notification message (from backend API or client)
 * to match the user's active application language ('ar' or 'en').
 *
 * If the message is already in the target language or has no dictionary entry,
 * it returns the sanitized original string (or fallback if empty).
 */
export function localizeToastMessage(
  rawMessage: string | null | undefined,
  targetLanguage: AppLanguage,
  fallbackMessage?: string,
): string {
  if (!rawMessage || !rawMessage.trim()) {
    if (fallbackMessage && fallbackMessage.trim()) {
      return fallbackMessage.trim();
    }
    return targetLanguage === 'ar' ? 'تمت العملية بنجاح.' : 'Operation completed successfully.';
  }

  const trimmed = rawMessage.trim();
  const normalized = normalizeForMatch(trimmed);

  // Exact or normalized match against the bilingual dictionary
  for (const entry of BILINGUAL_TOAST_ENTRIES) {
    const arNorm = normalizeForMatch(entry.ar);
    const enNorm = normalizeForMatch(entry.en);

    if (normalized === arNorm || normalized === enNorm) {
      return targetLanguage === 'ar' ? entry.ar : entry.en;
    }
  }

  // Partial / Substring containment match
  for (const entry of BILINGUAL_TOAST_ENTRIES) {
    const arNorm = normalizeForMatch(entry.ar);
    const enNorm = normalizeForMatch(entry.en);

    if (
      (arNorm.length > 8 && normalized.includes(arNorm)) ||
      (enNorm.length > 8 && normalized.includes(enNorm))
    ) {
      return targetLanguage === 'ar' ? entry.ar : entry.en;
    }
  }

  // If already in target language, or fallback requested
  return trimmed;
}
