import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  FilePlus2,
  FileText,
  Home,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react';
import './styles.css';
import {
  authenticate,
  deleteRecord,
  getDatabase,
  getSessionUser,
  initializeData,
  logout,
  saveDatabase,
  setUserProjects,
  upsertRecord
} from './services/localStorage';
import {
  CONTRACTOR_RATE,
  calculateProjectReport,
  calculateTransactionTotal,
  formatCurrency,
  formatDate,
  sumTransactions
} from './utils/calculations';
import { printReport } from './utils/pdf';

const categories = ['بناء', 'سباكة', 'كهرباء', 'مالي', 'أخرى'];
const statuses = ['نشط', 'متوقف', 'منتهي'];
const navItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: Home },
  { id: 'projects', label: 'المشاريع', icon: BriefcaseBusiness },
  { id: 'add', label: 'إضافة عهدة', icon: FilePlus2 },
  { id: 'transactions', label: 'العمليات', icon: ClipboardList },
  { id: 'reports', label: 'التقارير', icon: BarChart3 }
];

function useDatabase() {
  const [db, setDb] = useState(() => {
    initializeData();
    return getDatabase();
  });

  useEffect(() => {
    const refresh = () => setDb(getDatabase());
    window.addEventListener('storage-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('storage-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return db;
}

function App() {
  const [user, setUser] = useState(() => {
    initializeData();
    return getSessionUser();
  });
  const [page, setPage] = useState('dashboard');
  const [toast, setToast] = useState('');
  const db = useDatabase();

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} notify={notify} toast={toast} />;
  }

  const effectiveNav = user.role === 'admin' ? [...navItems, { id: 'users', label: 'المستخدمون', icon: Users }] : navItems;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" dir="rtl">
      <Shell user={user} page={page} setPage={setPage} navItems={effectiveNav} onLogout={() => { logout(); setUser(null); }}>
        {page === 'dashboard' && <Dashboard user={user} db={db} setPage={setPage} />}
        {page === 'projects' && <ProjectsPage user={user} db={db} notify={notify} />}
        {page === 'users' && user.role === 'admin' && <UsersPage db={db} notify={notify} />}
        {page === 'add' && <TransactionFormPage user={user} db={db} notify={notify} />}
        {page === 'transactions' && <TransactionsPage user={user} db={db} notify={notify} />}
        {page === 'reports' && <ReportsPage user={user} db={db} />}
      </Shell>
      <Toast message={toast} />
    </div>
  );
}

function LoginScreen({ onLogin, notify, toast }) {
  const [phone, setPhone] = useState('0910000000');
  const [password, setPassword] = useState('1234');

  const submit = (event) => {
    event.preventDefault();
    const user = authenticate(phone.trim(), password.trim());
    if (!user) {
      notify('تعذر تسجيل الدخول، تأكد من البيانات وحالة الحساب');
      return;
    }
    onLogin(user);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-navy text-white shadow-soft">
            <BriefcaseBusiness size={34} />
          </div>
          <h1 className="text-3xl font-extrabold text-brand-navy">منظومة عهدة مقاولات</h1>
          <p className="mt-2 text-sm text-slate-500">دخول سريع لتسجيل العهدة والفواتير على المشاريع</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <Label text="رقم الهاتف">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Label>
          <Label text="كلمة المرور">
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </Label>
          <button className="btn-primary mt-2 w-full" type="submit">دخول</button>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-bold text-brand-navy">بيانات تجريبية</p>
            <p>المسؤول: 0910000000 / 1234</p>
            <p>المستخدم: 0920000000 / 1234</p>
          </div>
        </form>
      </section>
      <Toast message={toast} />
    </main>
  );
}

function Shell({ user, page, setPage, navItems, onLogout, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="القائمة"><Menu size={20} /></button>
            <div>
              <h1 className="text-lg font-extrabold text-brand-navy">منظومة عهدة مقاولات</h1>
              <p className="text-xs text-slate-500">{user.name} - {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}</p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onLogout}><LogOut size={18} /> خروج</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-24 pt-5 lg:grid-cols-[230px_1fr] lg:pb-8">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-soft lg:block">
          <NavList items={navItems} page={page} setPage={setPage} />
        </aside>
        <main>{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => <MobileNavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />)}
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-brand-navy">القائمة</strong>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <NavList items={navItems} page={page} setPage={(next) => { setPage(next); setOpen(false); }} />
          </aside>
        </div>
      )}
    </>
  );
}

function NavList({ items, page, setPage }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} onClick={() => setPage(item.id)} className={`nav-btn ${page === item.id ? 'nav-btn-active' : ''}`}>
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobileNavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button className={`mobile-nav ${active ? 'mobile-nav-active' : ''}`} onClick={onClick}>
      <Icon size={20} />
      <span>{item.label}</span>
    </button>
  );
}

function Dashboard({ user, db, setPage }) {
  const visibleProjects = getVisibleProjects(user, db);
  const visibleTransactions = getVisibleTransactions(user, db);
  const total = sumTransactions(visibleTransactions);
  const contractor = user.role === 'admin' ? db.projects.reduce((sum, project) => {
    const projectTotal = sumTransactions(db.transactions.filter((t) => t.projectId === project.id));
    return sum + projectTotal * CONTRACTOR_RATE;
  }, 0) : 0;

  return (
    <Page title={user.role === 'admin' ? 'لوحة تحكم المسؤول' : 'لوحة تحكم المستخدم'}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="عدد المشاريع" value={visibleProjects.length} />
        {user.role === 'admin' && <Stat title="عدد المستخدمين" value={db.users.length} />}
        <Stat title={user.role === 'admin' ? 'إجمالي كل العمليات' : 'إجمالي عملياتي'} value={formatCurrency(total)} />
        {user.role === 'admin' && <Stat title="إجمالي نسبة المقاول 7%" value={formatCurrency(contractor)} />}
        {user.role === 'user' && <Stat title="عدد العمليات" value={visibleTransactions.length} />}
      </div>
      {user.role === 'user' && <button className="btn-primary mt-5" onClick={() => setPage('add')}><Plus size={18} /> إضافة عهدة جديدة</button>}
      <SectionTitle title="آخر العمليات" />
      <TransactionList transactions={visibleTransactions.slice(0, 5)} db={db} compact />
    </Page>
  );
}

function ProjectsPage({ user, db, notify }) {
  const [editing, setEditing] = useState(null);
  const visibleProjects = getVisibleProjects(user, db);
  const save = (payload) => {
    upsertRecord('projects', payload, 'p');
    setEditing(null);
    notify(payload.id ? 'تم تعديل المشروع' : 'تم إضافة المشروع');
  };

  const remove = (id) => {
    if (!confirm('هل تريد حذف المشروع؟ سيتم حذف روابطه وعملياته من التخزين المؤقت.')) return;
    const nextDb = {
      ...db,
      projects: db.projects.filter((project) => project.id !== id),
      userProjects: db.userProjects.filter((link) => link.projectId !== id),
      transactions: db.transactions.filter((transaction) => transaction.projectId !== id)
    };
    saveDatabase(nextDb);
    notify('تم حذف المشروع');
  };

  return (
    <Page title="المشاريع" action={user.role === 'admin' && <button className="btn-primary" onClick={() => setEditing({})}><Plus size={18} /> مشروع جديد</button>}>
      <CardsGrid>
        {visibleProjects.map((project) => (
          <article className="card" key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-brand-navy">{project.projectName}</h3>
                <p className="text-sm text-slate-500">{project.location} - {project.ownerName}</p>
              </div>
              <Badge>{project.status}</Badge>
            </div>
            {project.notes && <p className="mt-3 text-sm text-slate-600">{project.notes}</p>}
            {user.role === 'admin' && (
              <div className="mt-4 flex gap-2">
                <button className="btn-ghost" onClick={() => setEditing(project)}><Pencil size={17} /> تعديل</button>
                <button className="btn-danger" onClick={() => remove(project.id)}><Trash2 size={17} /> حذف</button>
              </div>
            )}
          </article>
        ))}
      </CardsGrid>
      {!visibleProjects.length && <EmptyState text="لا توجد مشاريع لعرضها" />}
      {editing && <ProjectModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </Page>
  );
}

function UsersPage({ db, notify }) {
  const [editing, setEditing] = useState(null);
  const save = (user, projectIds) => {
    const saved = upsertRecord('users', user, 'u');
    setUserProjects(saved.id, projectIds);
    setEditing(null);
    notify(user.id ? 'تم تعديل المستخدم' : 'تم إضافة المستخدم');
  };

  return (
    <Page title="المستخدمون" action={<button className="btn-primary" onClick={() => setEditing({ role: 'user', status: 'active' })}><Plus size={18} /> مستخدم جديد</button>}>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft lg:block">
        <table className="desktop-table">
          <thead><tr><th>الاسم</th><th>الهاتف</th><th>الدور</th><th>الحالة</th><th>المشاريع</th><th></th></tr></thead>
          <tbody>
            {db.users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td><td>{user.phone}</td><td>{user.role === 'admin' ? 'مسؤول' : 'مستخدم'}</td><td>{user.status === 'active' ? 'فعال' : 'معطل'}</td>
                <td>{projectNamesForUser(user.id, db).join('، ') || '-'}</td>
                <td><button className="btn-ghost" onClick={() => setEditing(user)}><Pencil size={17} /> تعديل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CardsGrid className="lg:hidden">
        {db.users.map((user) => <article className="card" key={user.id}><h3 className="font-bold">{user.name}</h3><p>{user.phone}</p><p>{projectNamesForUser(user.id, db).join('، ') || '-'}</p><button className="btn-ghost mt-3" onClick={() => setEditing(user)}><Pencil size={17} /> تعديل</button></article>)}
      </CardsGrid>
      {editing && <UserModal initial={editing} db={db} onClose={() => setEditing(null)} onSave={save} />}
    </Page>
  );
}

function TransactionFormPage({ user, db, notify }) {
  return <TransactionEditor user={user} db={db} notify={notify} />;
}

function TransactionsPage({ user, db, notify }) {
  const [filters, setFilters] = useState({});
  const [editing, setEditing] = useState(null);
  const visible = applyTransactionFilters(getVisibleTransactions(user, db), filters);

  const remove = (id) => {
    if (!confirm('هل تريد حذف العملية؟')) return;
    deleteRecord('transactions', id);
    notify('تم حذف العملية');
  };

  return (
    <Page title="العمليات">
      <TransactionFilters user={user} db={db} filters={filters} setFilters={setFilters} />
      <TransactionList transactions={visible} db={db} actions={(transaction) => (
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setEditing(transaction)}><Pencil size={17} /> تعديل</button>
          <button className="btn-danger" onClick={() => remove(transaction.id)}><Trash2 size={17} /> حذف</button>
        </div>
      )} />
      {!visible.length && <EmptyState text="لا توجد عمليات حسب الفلاتر الحالية" />}
      {editing && (
        <Modal title="تعديل العملية" onClose={() => setEditing(null)}>
          <TransactionEditor user={user} db={db} notify={(msg) => { notify(msg); setEditing(null); }} initial={editing} embedded />
        </Modal>
      )}
    </Page>
  );
}

function ReportsPage({ user, db }) {
  const [filters, setFilters] = useState({ projectId: '', userId: '', from: '', to: '' });
  const all = applyTransactionFilters(getVisibleTransactions(user, db), filters);
  const selectedProject = db.projects.find((p) => p.id === filters.projectId);
  const selectedUser = db.users.find((u) => u.id === (user.role === 'admin' ? filters.userId : user.id));
  const totals = selectedProject ? calculateProjectReport(all) : { custodyTotal: sumTransactions(all), contractorAmount: 0, finalTotal: sumTransactions(all) };

  return (
    <Page title="التقارير" action={<button className="btn-primary" onClick={() => printReport('printable-report', 'تقرير منظومة عهدة مقاولات')}><Printer size={18} /> تحميل PDF</button>}>
      <div className="filters">
        <Select label="المشروع" value={filters.projectId} onChange={(projectId) => setFilters({ ...filters, projectId })} options={[['', 'كل المشاريع'], ...getVisibleProjects(user, db).map((p) => [p.id, p.projectName])]} />
        {user.role === 'admin' && <Select label="المستخدم" value={filters.userId} onChange={(userId) => setFilters({ ...filters, userId })} options={[['', 'كل المستخدمين'], ...db.users.map((u) => [u.id, u.name])]} />}
        <Label text="من"><input className="input" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></Label>
        <Label text="إلى"><input className="input" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></Label>
      </div>
      <section id="printable-report" className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-2xl font-extrabold text-brand-navy">{selectedProject ? 'تقرير المشروع' : 'تقرير العمليات'}</h2>
        <p className="text-sm text-slate-500">الفترة: {filters.from || 'البداية'} إلى {filters.to || 'اليوم'}</p>
        {selectedProject && <p className="mt-2">المشروع: {selectedProject.projectName} - الموقع: {selectedProject.location} - المالك: {selectedProject.ownerName}</p>}
        {!selectedProject && selectedUser && <p className="mt-2">المستخدم: {selectedUser.name}</p>}
        <div className="summary mt-4 grid gap-3 sm:grid-cols-3">
          <Stat title="إجمالي العهدة" value={formatCurrency(totals.custodyTotal)} />
          {selectedProject && <Stat title="قيمة نسبة المقاول 7%" value={formatCurrency(totals.contractorAmount)} />}
          {selectedProject && <Stat title="الإجمالي النهائي" value={formatCurrency(totals.finalTotal)} />}
        </div>
        <TransactionTable transactions={all} db={db} />
      </section>
    </Page>
  );
}

function TransactionEditor({ user, db, notify, initial = {}, embedded = false }) {
  const allowedProjects = getVisibleProjects(user, db);
  const [form, setForm] = useState({
    id: initial.id,
    date: initial.date || new Date().toISOString().slice(0, 10),
    userId: initial.userId || user.id,
    projectId: initial.projectId || allowedProjects[0]?.id || '',
    category: initial.category || 'بناء',
    itemName: initial.itemName || '',
    quantity: initial.quantity || 1,
    unitPrice: initial.unitPrice || 0,
    notes: initial.notes || '',
    attachments: initial.attachments || [],
    createdAt: initial.createdAt
  });
  const total = calculateTransactionTotal(form.quantity, form.unitPrice);

  const submit = async (event) => {
    event.preventDefault();
    upsertRecord('transactions', { ...form, total, attachments: form.attachments || [] }, 't');
    notify(form.id ? 'تم تعديل العملية' : 'تم حفظ العملية');
    if (!form.id) setForm({ ...form, itemName: '', quantity: 1, unitPrice: 0, notes: '', attachments: [] });
  };

  const readFiles = (files) => {
    Array.from(files).slice(0, 2).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setForm((prev) => ({ ...prev, attachments: [...(prev.attachments || []), { name: file.name, data: reader.result }] }));
      reader.readAsDataURL(file);
    });
  };

  return (
    <form onSubmit={submit} className={embedded ? '' : 'rounded-2xl border border-slate-200 bg-white p-4 shadow-soft'}>
      {!embedded && <h2 className="mb-4 text-xl font-extrabold text-brand-navy">إضافة عهدة</h2>}
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="المشروع" value={form.projectId} onChange={(projectId) => setForm({ ...form, projectId })} options={allowedProjects.map((p) => [p.id, p.projectName])} />
        <Label text="التاريخ"><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Label>
        <Select label="التصنيف" value={form.category} onChange={(category) => setForm({ ...form, category })} options={categories.map((c) => [c, c])} />
        <Label text="اسم الصنف / البيان"><input className="input" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required /></Label>
        <Label text="الكمية"><input className="input" type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Label>
        <Label text="السعر"><input className="input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} required /></Label>
      </div>
      <div className="mt-3 rounded-xl bg-brand-mint p-4 text-brand-navy"><strong>الإجمالي: {formatCurrency(total)}</strong></div>
      <Label text="ملاحظات"><textarea className="input min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Label>
      <Label text="مرفقات اختيارية"><input className="input" type="file" multiple onChange={(e) => readFiles(e.target.files)} /></Label>
      {!!form.attachments?.length && <p className="text-sm text-slate-500">عدد المرفقات: {form.attachments.length}</p>}
      <button className="btn-primary mt-4 w-full md:w-auto" type="submit">حفظ</button>
    </form>
  );
}

function TransactionFilters({ user, db, filters, setFilters }) {
  return (
    <div className="filters">
      <Select label="المشروع" value={filters.projectId || ''} onChange={(projectId) => setFilters({ ...filters, projectId })} options={[['', 'كل المشاريع'], ...getVisibleProjects(user, db).map((p) => [p.id, p.projectName])]} />
      {user.role === 'admin' && <Select label="المستخدم" value={filters.userId || ''} onChange={(userId) => setFilters({ ...filters, userId })} options={[['', 'كل المستخدمين'], ...db.users.map((u) => [u.id, u.name])]} />}
      {user.role === 'admin' && <Select label="التصنيف" value={filters.category || ''} onChange={(category) => setFilters({ ...filters, category })} options={[['', 'كل التصنيفات'], ...categories.map((c) => [c, c])]} />}
      <Label text="بحث"><div className="relative"><Search className="absolute right-3 top-3 text-slate-400" size={18} /><input className="input pr-10" value={filters.search || ''} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div></Label>
    </div>
  );
}

function TransactionList({ transactions, db, actions, compact = false }) {
  if (!transactions.length) return <EmptyState text="لا توجد عمليات حتى الآن" />;
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft lg:block">
        <TransactionTable transactions={transactions} db={db} actions={actions} compact={compact} />
      </div>
      <CardsGrid className="lg:hidden">
        {transactions.map((transaction) => (
          <article className="card" key={transaction.id}>
            <div className="flex justify-between gap-3">
              <div><h3 className="font-extrabold text-brand-navy">{transaction.itemName}</h3><p className="text-sm text-slate-500">{formatDate(transaction.date)} - {transaction.category}</p></div>
              <strong>{formatCurrency(transaction.total)}</strong>
            </div>
            <p className="mt-2 text-sm text-slate-600">{nameById(db.projects, transaction.projectId, 'projectName')} - {nameById(db.users, transaction.userId, 'name')}</p>
            {transaction.notes && <p className="mt-2 text-sm">{transaction.notes}</p>}
            {actions && <div className="mt-4">{actions(transaction)}</div>}
          </article>
        ))}
      </CardsGrid>
    </>
  );
}

function TransactionTable({ transactions, db, actions, compact }) {
  return (
    <table className="desktop-table">
      <thead><tr><th>التاريخ</th><th>المشروع</th><th>المستخدم</th><th>التصنيف</th><th>البيان</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>الملاحظات</th>{actions && <th></th>}</tr></thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td>{formatDate(transaction.date)}</td><td>{nameById(db.projects, transaction.projectId, 'projectName')}</td><td>{nameById(db.users, transaction.userId, 'name')}</td><td>{transaction.category}</td><td>{transaction.itemName}</td><td>{transaction.quantity}</td><td>{formatCurrency(transaction.unitPrice)}</td><td className="font-bold">{formatCurrency(transaction.total)}</td><td>{transaction.notes || '-'}</td>{actions && <td>{actions(transaction)}</td>}
          </tr>
        ))}
      </tbody>
      {!compact && <tfoot><tr><td colSpan={7}>الإجمالي</td><td className="font-extrabold">{formatCurrency(sumTransactions(transactions))}</td><td colSpan={actions ? 2 : 1}></td></tr></tfoot>}
    </table>
  );
}

function ProjectModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ projectName: '', location: '', ownerName: '', status: 'نشط', notes: '', ...initial });
  return (
    <Modal title={form.id ? 'تعديل مشروع' : 'إضافة مشروع'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Label text="اسم المشروع"><input className="input" value={form.projectName} onChange={(e) => setForm({ ...form, projectName: e.target.value })} required /></Label>
        <Label text="الموقع"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></Label>
        <Label text="المالك"><input className="input" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} required /></Label>
        <Select label="الحالة" value={form.status} onChange={(status) => setForm({ ...form, status })} options={statuses.map((s) => [s, s])} />
        <Label text="ملاحظات"><textarea className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Label>
        <button className="btn-primary w-full">حفظ</button>
      </form>
    </Modal>
  );
}

function UserModal({ initial, db, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', password: '1234', role: 'user', status: 'active', ...initial });
  const [projectIds, setProjectIds] = useState(() => db.userProjects.filter((link) => link.userId === initial.id).map((link) => link.projectId));
  const toggle = (projectId) => setProjectIds((current) => current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]);
  return (
    <Modal title={form.id ? 'تعديل مستخدم' : 'إضافة مستخدم'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(form, projectIds); }}>
        <Label text="الاسم"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Label>
        <Label text="الهاتف"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Label>
        <Label text="كلمة المرور"><input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Label>
        <Select label="الدور" value={form.role} onChange={(role) => setForm({ ...form, role })} options={[['admin', 'مسؤول'], ['user', 'مستخدم']]} />
        <Select label="الحالة" value={form.status} onChange={(status) => setForm({ ...form, status })} options={[['active', 'فعال'], ['inactive', 'معطل']]} />
        <div className="mb-4">
          <p className="mb-2 text-sm font-bold">ربط المشاريع</p>
          <div className="grid gap-2">
            {db.projects.map((project) => <label key={project.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3"><input type="checkbox" checked={projectIds.includes(project.id)} onChange={() => toggle(project.id)} /> {project.projectName}</label>)}
          </div>
        </div>
        <button className="btn-primary w-full">حفظ</button>
      </form>
    </Modal>
  );
}

function Page({ title, action, children }) {
  return <section><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-extrabold text-brand-navy">{title}</h2>{action}</div>{children}</section>;
}

function SectionTitle({ title }) {
  return <h3 className="mb-3 mt-7 text-lg font-extrabold text-brand-navy">{title}</h3>;
}

function Stat({ title, value }) {
  return <div className="box"><p className="text-sm text-slate-500">{title}</p><strong className="mt-2 block text-2xl text-brand-navy">{value}</strong></div>;
}

function CardsGrid({ children, className = '' }) {
  return <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>;
}

function Label({ text, children }) {
  return <label className="mb-3 block"><span className="mb-1 block text-sm font-bold text-slate-700">{text}</span>{children}</label>;
}

function Select({ label, value, onChange, options }) {
  return <Label text={label}><select className="input" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([id, text]) => <option key={id || 'all'} value={id}>{text}</option>)}</select></Label>;
}

function Badge({ children }) {
  return <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-bold text-brand-green">{children}</span>;
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">{text}</div>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/35 p-0 sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-white p-4 shadow-soft sm:max-w-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-extrabold text-brand-navy">{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="fixed bottom-24 left-4 right-4 z-[60] rounded-xl bg-brand-navy px-4 py-3 text-center font-bold text-white shadow-soft sm:bottom-5 sm:right-auto sm:w-96">{message}</div>;
}

function getVisibleProjects(user, db) {
  if (user.role === 'admin') return db.projects;
  const ids = db.userProjects.filter((link) => link.userId === user.id).map((link) => link.projectId);
  return db.projects.filter((project) => ids.includes(project.id));
}

function getVisibleTransactions(user, db) {
  return user.role === 'admin' ? db.transactions : db.transactions.filter((transaction) => transaction.userId === user.id);
}

function applyTransactionFilters(transactions, filters) {
  return transactions.filter((transaction) => {
    if (filters.projectId && transaction.projectId !== filters.projectId) return false;
    if (filters.userId && transaction.userId !== filters.userId) return false;
    if (filters.category && transaction.category !== filters.category) return false;
    if (filters.from && transaction.date < filters.from) return false;
    if (filters.to && transaction.date > filters.to) return false;
    if (filters.search && !`${transaction.itemName} ${transaction.notes}`.includes(filters.search)) return false;
    return true;
  });
}

function nameById(list, id, key) {
  return list.find((item) => item.id === id)?.[key] || '-';
}

function projectNamesForUser(userId, db) {
  const ids = db.userProjects.filter((link) => link.userId === userId).map((link) => link.projectId);
  return db.projects.filter((project) => ids.includes(project.id)).map((project) => project.projectName);
}

const rootElement = document.getElementById('root');
const root = window.__contractingRoot || createRoot(rootElement);
window.__contractingRoot = root;
root.render(<App />);
