import { lazy, type ComponentType } from 'react';
import {
  BrandPage,
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const InputDemo = lazyPage(() =>
  import('./demos/input').then(({ InputDemo }) => InputDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const DialogDemo = lazyPage(() =>
  import('./demos/dialog').then(({ DialogDemo }) => DialogDemo),
);
const ResultsListDemo = lazyPage(() =>
  import('./demos/results-list').then(({ ResultsListDemo }) => ResultsListDemo),
);

export type PreviewEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = {
  name: string;
  entries: PreviewEntry[];
};

export const DESIGN_SYSTEM = {
  title: 'Math With Hawra',
  description:
    'نظام تصميم عربي RTL مستخرج من منصة Math With Hawra التعليمية.',
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: 'overview',
  name: 'نظرة عامة',
  description: 'الهوية المرئية والمبادئ التي تشكل النظام.',
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'الهوية',
    entries: [
      {
        id: 'brand-overview',
        name: 'الهوية',
        description: 'الشعار، النبرة، والثنائية الوردية والصفراء.',
        Page: BrandPage,
      },
    ],
  },
  {
    name: 'الأساسيات',
    entries: [
      {
        id: 'color-roles',
        name: 'الألوان',
        description: 'الألوان الأساسية، الدلالية، والخلفيات.',
        Page: ColorsPage,
      },
      {
        id: 'type-scale',
        name: 'الخط',
        description: 'Tajawal، التسلسل الهرمي، والنص العربي.',
        Page: FontsPage,
      },
      {
        id: 'spacing-radius',
        name: 'المسافات والحواف',
        description: 'الإيقاع والمساحات والحواف المستديرة.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'المكونات المستخرجة',
    entries: [
      {
        id: 'button',
        name: 'الأزرار',
        description: 'إجراءات المعلمة والطالبة والحالات المختلفة.',
        Page: ButtonDemo,
      },
      {
        id: 'input',
        name: 'الحقول',
        description: 'حقول التسجيل ورمز النشاط وإدخال الإجابات.',
        Page: InputDemo,
      },
      {
        id: 'badge',
        name: 'الشارات والحالات',
        description: 'مكتمل، قيد المراجعة، وخطأ.',
        Page: BadgeDemo,
      },
      {
        id: 'card',
        name: 'البطاقات الزجاجية',
        description: 'تجميع محتوى لوحة المعلمة وتجربة الطالبة.',
        Page: CardDemo,
      },
      {
        id: 'dialog',
        name: 'نافذة الحل',
        description: 'نافذة تفاصيل الإجابة مع رأس وفوتر ثابتين.',
        Page: DialogDemo,
      },
      {
        id: 'results-list',
        name: 'نتائج الطالبات',
        description: 'قائمة نتائج متجاوبة مع التحديد والإجراءات.',
        Page: ResultsListDemo,
      },
    ],
  },
  {
    name: 'موثق لاحقاً',
    entries: [],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [
  OVERVIEW_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(
      ', ',
    )}. Every page id must be unique across all nav groups.`,
  );
}