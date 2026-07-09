import { Specialty } from '../models/specialty.model';

export const SERVICE_REQUEST_SPECIALTIES: readonly Specialty[] = [
  {
    id: 'internal-medicine',
    code: 'IM',
    name: {
      ar: 'باطنة',
      en: 'Internal Medicine',
    },
    description: {
      ar: 'عيادات الباطنة العامة والحالات المزمنة.',
      en: 'General internal medicine and chronic condition clinics.',
    },
    icon: 'bi-heart-pulse',
    tone: 'blue',
    estimatedWaitingMinutes: 9,
    subSpecialties: [
      {
        id: 'diabetes',
        code: 'DM',
        name: {
          ar: 'سكر',
          en: 'Diabetes',
        },
        description: {
          ar: 'متابعة السكر وتنظيم العلاج.',
          en: 'Diabetes follow-up and treatment adjustment.',
        },
        icon: 'bi-droplet-half',
        tone: 'cyan',
        estimatedWaitingMinutes: 6,
        subSpecialties: [],
      },
      {
        id: 'cardiology',
        code: 'CR',
        name: {
          ar: 'قلب',
          en: 'Cardiology',
        },
        description: {
          ar: 'كشف القلب وضغط الدم ورسم القلب.',
          en: 'Heart, blood pressure, and ECG consultation.',
        },
        icon: 'bi-heart',
        tone: 'red',
        estimatedWaitingMinutes: 8,
        subSpecialties: [],
      },
      {
        id: 'gastroenterology',
        code: 'GE',
        name: {
          ar: 'جهاز هضمي',
          en: 'Gastroenterology',
        },
        description: {
          ar: 'مشاكل المعدة والقولون والكبد.',
          en: 'Stomach, colon, and liver concerns.',
        },
        icon: 'bi-capsule',
        tone: 'green',
        estimatedWaitingMinutes: 7,
        subSpecialties: [],
      },
    ],
  },
  {
    id: 'orthopedics',
    code: 'OR',
    name: {
      ar: 'عظام',
      en: 'Orthopedics',
    },
    description: {
      ar: 'إصابات العظام والمفاصل والعمود الفقري.',
      en: 'Bones, joints, injuries, and spine services.',
    },
    icon: 'bi-bandaid',
    tone: 'orange',
    estimatedWaitingMinutes: 10,
    subSpecialties: [
      {
        id: 'sports-injuries',
        code: 'SI',
        name: {
          ar: 'إصابات ملاعب',
          en: 'Sports Injuries',
        },
        description: {
          ar: 'إصابات العضلات والأربطة والملاعب.',
          en: 'Muscle, ligament, and sports injury care.',
        },
        icon: 'bi-activity',
        tone: 'green',
        estimatedWaitingMinutes: 6,
        subSpecialties: [],
      },
      {
        id: 'spine',
        code: 'SP',
        name: {
          ar: 'عمود فقري',
          en: 'Spine',
        },
        description: {
          ar: 'آلام الظهر والرقبة والانزلاق الغضروفي.',
          en: 'Back, neck, and disc condition consultation.',
        },
        icon: 'bi-diagram-3',
        tone: 'purple',
        estimatedWaitingMinutes: 8,
        subSpecialties: [],
      },
    ],
  },
  {
    id: 'dermatology',
    code: 'DR',
    name: {
      ar: 'جلدية',
      en: 'Dermatology',
    },
    description: {
      ar: 'أمراض الجلد والشعر والتجميل.',
      en: 'Skin, hair, and cosmetic dermatology.',
    },
    icon: 'bi-stars',
    tone: 'purple',
    estimatedWaitingMinutes: 8,
    subSpecialties: [
      {
        id: 'skin-clinic',
        code: 'SC',
        name: {
          ar: 'أمراض جلدية',
          en: 'Skin Clinic',
        },
        description: {
          ar: 'كشف الجلد والحساسية والالتهابات.',
          en: 'Skin conditions, allergy, and inflammation.',
        },
        icon: 'bi-search-heart',
        tone: 'blue',
        estimatedWaitingMinutes: 5,
        subSpecialties: [],
      },
      {
        id: 'laser',
        code: 'LS',
        name: {
          ar: 'ليزر',
          en: 'Laser',
        },
        description: {
          ar: 'جلسات الليزر والإجراءات التجميلية.',
          en: 'Laser sessions and cosmetic procedures.',
        },
        icon: 'bi-lightning-charge',
        tone: 'orange',
        estimatedWaitingMinutes: 7,
        subSpecialties: [],
      },
    ],
  },
  {
    id: 'pediatrics',
    code: 'PD',
    name: {
      ar: 'أطفال',
      en: 'Pediatrics',
    },
    description: {
      ar: 'كشف الأطفال والمتابعة الدورية.',
      en: 'Pediatric examination and follow-up care.',
    },
    icon: 'bi-emoji-smile',
    tone: 'cyan',
    estimatedWaitingMinutes: 7,
    subSpecialties: [
      {
        id: 'newborns',
        code: 'NB',
        name: {
          ar: 'حديثي الولادة',
          en: 'Newborns',
        },
        description: {
          ar: 'متابعة حديثي الولادة والرضاعة.',
          en: 'Newborn follow-up and feeding guidance.',
        },
        icon: 'bi-flower1',
        tone: 'green',
        estimatedWaitingMinutes: 6,
        subSpecialties: [],
      },
      {
        id: 'vaccines',
        code: 'VC',
        name: {
          ar: 'تطعيمات',
          en: 'Vaccines',
        },
        description: {
          ar: 'استعلام وتسجيل تطعيمات الأطفال.',
          en: 'Pediatric vaccine registration and guidance.',
        },
        icon: 'bi-shield-check',
        tone: 'blue',
        estimatedWaitingMinutes: 4,
        subSpecialties: [],
      },
    ],
  },
  {
    id: 'clinical-pathology',
    code: 'CP',
    name: {
      ar: 'تحاليل طبية',
      en: 'Clinical Pathology',
    },
    description: {
      ar: 'سحب عينات ونتائج التحاليل.',
      en: 'Sample collection and lab result services.',
    },
    icon: 'bi-eyedropper',
    tone: 'green',
    estimatedWaitingMinutes: 6,
    subSpecialties: [],
  },
  {
    id: 'radiology',
    code: 'RD',
    name: {
      ar: 'أشعة تشخيصية',
      en: 'Diagnostic Radiology',
    },
    description: {
      ar: 'أشعة عادية وموجات وسونار ورنين.',
      en: 'X-ray, ultrasound, CT, and MRI services.',
    },
    icon: 'bi-camera',
    tone: 'blue',
    estimatedWaitingMinutes: 12,
    subSpecialties: [
      {
        id: 'x-ray',
        code: 'XR',
        name: {
          ar: 'أشعة عادية',
          en: 'X-Ray',
        },
        description: {
          ar: 'تصوير الأشعة العادية.',
          en: 'Standard X-ray imaging.',
        },
        icon: 'bi-image',
        tone: 'cyan',
        estimatedWaitingMinutes: 5,
        subSpecialties: [],
      },
      {
        id: 'ultrasound',
        code: 'US',
        name: {
          ar: 'سونار',
          en: 'Ultrasound',
        },
        description: {
          ar: 'فحوصات السونار والموجات فوق الصوتية.',
          en: 'Ultrasound examination services.',
        },
        icon: 'bi-broadcast',
        tone: 'green',
        estimatedWaitingMinutes: 7,
        subSpecialties: [],
      },
    ],
  },
  {
    id: 'emergency-triage',
    code: 'ER',
    name: {
      ar: 'فرز طوارئ',
      en: 'Emergency Triage',
    },
    description: {
      ar: 'توجيه سريع لحالات الطوارئ.',
      en: 'Fast routing for emergency cases.',
    },
    icon: 'bi-hospital',
    tone: 'red',
    estimatedWaitingMinutes: 3,
    subSpecialties: [],
  },
];
