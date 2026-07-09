import { ServiceType } from '../models/service-type.model';

export const SERVICE_REQUEST_SERVICE_TYPES: readonly ServiceType[] = [
  {
    id: 'reception',
    code: 'REC',
    ticketPrefix: 'R',
    name: {
      ar: 'استقبال',
      en: 'Reception',
    },
    description: {
      ar: 'تسجيل بيانات أو استعلام أو توجيه داخل الفرع.',
      en: 'Registration, inquiry, or branch guidance.',
    },
    icon: 'bi-person-lines-fill',
    tone: 'blue',
    estimatedWaitingMinutes: 5,
    specialtyIds: [
      'internal-medicine',
      'orthopedics',
      'dermatology',
      'pediatrics',
      'clinical-pathology',
      'radiology',
    ],
  },
  {
    id: 'consultation',
    code: 'CON',
    ticketPrefix: 'C',
    name: {
      ar: 'كشف',
      en: 'Consultation',
    },
    description: {
      ar: 'حجز كشف طبي مع التخصص المناسب.',
      en: 'Book a medical consultation with the right department.',
    },
    icon: 'bi-clipboard2-pulse',
    tone: 'cyan',
    estimatedWaitingMinutes: 8,
    specialtyIds: ['internal-medicine', 'orthopedics', 'dermatology', 'pediatrics'],
  },
  {
    id: 'emergency',
    code: 'EMR',
    ticketPrefix: 'E',
    name: {
      ar: 'طوارئ',
      en: 'Emergency',
    },
    description: {
      ar: 'توجيه سريع للحالات العاجلة.',
      en: 'Fast lane for urgent cases.',
    },
    icon: 'bi-exclamation-triangle',
    tone: 'red',
    estimatedWaitingMinutes: 2,
    specialtyIds: ['emergency-triage', 'internal-medicine', 'orthopedics', 'pediatrics'],
  },
  {
    id: 'laboratory',
    code: 'LAB',
    ticketPrefix: 'L',
    name: {
      ar: 'معمل',
      en: 'Laboratory',
    },
    description: {
      ar: 'سحب عينات واستلام نتائج التحاليل.',
      en: 'Sample collection and lab result pickup.',
    },
    icon: 'bi-beaker',
    tone: 'green',
    estimatedWaitingMinutes: 6,
    specialtyIds: ['clinical-pathology'],
  },
  {
    id: 'radiology-service',
    code: 'RAD',
    ticketPrefix: 'X',
    name: {
      ar: 'أشعة',
      en: 'Radiology',
    },
    description: {
      ar: 'خدمات الأشعة والتصوير التشخيصي.',
      en: 'Radiology and diagnostic imaging services.',
    },
    icon: 'bi-camera-fill',
    tone: 'orange',
    estimatedWaitingMinutes: 9,
    specialtyIds: ['radiology'],
  },
];
