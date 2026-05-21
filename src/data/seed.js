const now = new Date().toISOString();

export const seedData = {
  users: [
    {
      id: 'u-admin',
      name: 'المسؤول العام',
      phone: '0910000000',
      password: '1234',
      role: 'admin',
      status: 'active',
      createdAt: now
    },
    {
      id: 'u-user',
      name: 'محمد سالم',
      phone: '0920000000',
      password: '1234',
      role: 'user',
      status: 'active',
      createdAt: now
    }
  ],
  projects: [
    {
      id: 'p-1',
      projectName: 'مشروع فيلا النخيل',
      location: 'طرابلس',
      ownerName: 'شركة النخيل',
      status: 'نشط',
      notes: 'مرحلة التشطيبات',
      createdAt: now
    },
    {
      id: 'p-2',
      projectName: 'صيانة مجمع الواحة',
      location: 'مصراتة',
      ownerName: 'إدارة المجمع',
      status: 'نشط',
      notes: 'أعمال صيانة عامة',
      createdAt: now
    }
  ],
  userProjects: [
    { id: 'up-1', userId: 'u-user', projectId: 'p-1' }
  ],
  transactions: [
    {
      id: 't-1',
      date: '2026-05-01',
      userId: 'u-user',
      projectId: 'p-1',
      category: 'بناء',
      itemName: 'أسمنت ومواد بناء',
      quantity: 20,
      unitPrice: 38,
      total: 760,
      notes: 'فاتورة توريد',
      attachments: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 't-2',
      date: '2026-05-04',
      userId: 'u-user',
      projectId: 'p-1',
      category: 'كهرباء',
      itemName: 'كابلات ومفاتيح',
      quantity: 1,
      unitPrice: 520,
      total: 520,
      notes: 'مرحلة التمديدات',
      attachments: [],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 't-3',
      date: '2026-05-09',
      userId: 'u-admin',
      projectId: 'p-2',
      category: 'سباكة',
      itemName: 'مستلزمات سباكة',
      quantity: 8,
      unitPrice: 65,
      total: 520,
      notes: 'إصلاحات عاجلة',
      attachments: [],
      createdAt: now,
      updatedAt: now
    }
  ]
};
