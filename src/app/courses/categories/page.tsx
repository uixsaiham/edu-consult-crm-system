"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FolderTree, PencilLine, Plus, Tags, Trash2, TrendingUp, Wand2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/office/office-ui";
import { StatusSwitch } from "@/components/institutions/row-actions";
import { formatDay } from "@/components/people/people-ui";
import { applicationCounts, categoryFor, getCategories, getCourses, saveCategories, saveCourses, type Course, type CourseCategory } from "@/lib/mock/courses";
import { cn } from "@/lib/utils";

/** "2 yrs ago", "5 mths ago", "3 days ago" relative to the demo's today. */
function age(iso: string) {
  const days = Math.max(0, Math.round((Date.parse("2026-09-17") - Date.parse(iso)) / 86400000));
  if (days >= 365) return `${Math.floor(days / 365)} yr${days >= 730 ? "s" : ""} ago`;
  if (days >= 30) return `${Math.floor(days / 30)} mth${days >= 60 ? "s" : ""} ago`;
  return days === 0 ? "Today" : `${days} day${days === 1 ? "" : "s"} ago`;
}

type Sort = "" | "name" | "courses" | "conversion" | "newest";

const colors = ["bg-primary", "bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-slate-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500", "bg-lime-500"];

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState<CourseCategory[]>(getCategories);
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<CourseCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<CourseCategory | null>(null);
  const [toast, notify] = useToast();
  const counts = useMemo(() => applicationCounts(), []);

  useEffect(() => saveCategories(categories), [categories]);
  useEffect(() => saveCourses(courses), [courses]);

  const stats = useMemo(() => {
    const m = new Map<string, { courses: Course[]; apps: number; enrolled: number }>();
    for (const c of courses) {
      const s = m.get(c.categoryId) ?? { courses: [], apps: 0, enrolled: 0 };
      s.courses.push(c);
      s.apps += counts(c).total;
      s.enrolled += counts(c).enrolled;
      m.set(c.categoryId, s);
    }
    return (id: string) => m.get(id) ?? { courses: [], apps: 0, enrolled: 0 };
  }, [courses, counts]);

  const known = new Set(categories.map((c) => c.id));
  const uncategorised = courses.filter((c) => !known.has(c.categoryId));
  const ranked = [...categories].sort((a, b) => stats(b.id).apps - stats(a.id).apps);
  const maxApps = Math.max(1, ...categories.map((c) => stats(c.id).apps));
  const q = search.trim().toLowerCase();
  const conv = (id: string) => (stats(id).apps ? stats(id).enrolled / stats(id).apps : 0);
  const shown = categories
    .filter((c) => (!status || (status === "Active") === c.active) && (!q || `${c.name} ${c.description} ${c.keywords.join(" ")}`.toLowerCase().includes(q)))
    .sort((a, b) =>
      sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : sort === "name" ? a.name.localeCompare(b.name) : sort === "courses" ? stats(b.id).courses.length - stats(a.id).courses.length : sort === "conversion" ? conv(b.id) - conv(a.id) : stats(b.id).apps - stats(a.id).apps
    );

  const autoAssign = () => {
    setCourses((prev) => prev.map((c) => (known.has(c.categoryId) ? c : { ...c, categoryId: categoryFor(c.name, categories) })));
    notify(`${uncategorised.length} course${uncategorised.length === 1 ? "" : "s"} categorised by keyword`);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Course Categories</h2>
          <p className="mt-1 text-sm text-muted-foreground">Subject areas used to organise courses, filter the catalogue and report on demand.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add category</button>
      </header>

      <StatGrid>
        <StatCard icon={FolderTree} label="Categories" value={categories.length} note={`${categories.filter((c) => c.active).length} active`} onClick={() => setStatus("Active")} />
        <StatCard icon={BookOpen} tone="primary" label="Courses categorised" value={courses.length - uncategorised.length} note={`of ${courses.length}`} />
        <StatCard icon={TrendingUp} tone="success" label="Most applied" value={ranked[0]?.name.split(" ")[0] ?? "—"} note={ranked[0] ? `${stats(ranked[0].id).apps} apps` : undefined} />
        <StatCard icon={Tags} tone={uncategorised.length ? "warning" : "neutral"} label="Uncategorised" value={uncategorised.length} />
      </StatGrid>

      {uncategorised.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm">
          <Tags className="size-4 text-warning" />
          <span className="flex-1 text-foreground">{uncategorised.length} course{uncategorised.length === 1 ? " has" : "s have"} no category and won&apos;t show under any category filter.</span>
          <button type="button" onClick={autoAssign} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-semibold text-foreground shadow-xs hover:bg-surface-hover"><Wand2 className="size-3.5" /> Categorise by keyword</button>
        </div>
      )}

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search categories or keywords…" label="Search categories" />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="All statuses" options={[{ value: "Active", label: "Active", dot: "bg-success", hint: categories.filter((c) => c.active).length }, { value: "Inactive", label: "Inactive", dot: "bg-muted-foreground", hint: categories.filter((c) => !c.active).length }]} />
        <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Most applications" options={[{ value: "newest", label: "Newest first" }, { value: "name", label: "Name A–Z" }, { value: "courses", label: "Most courses" }, { value: "conversion", label: "Best conversion" }]} />
        {(search || sort || status) && <ResetFilters onClick={() => { setSearch(""); setSort(""); setStatus(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">All categories</h3>
          <p className="text-xs text-muted-foreground">{shown.length} of {categories.length} categories · course titles are matched to keywords to suggest a category</p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Category</th>
                <th className="px-3 py-2.5">Keywords</th>
                <th className="px-3 py-2.5">Courses</th>
                <th className="px-3 py-2.5">Applications & enrolled</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((cat) => {
                const s = stats(cat.id);
                const published = s.courses.filter((c) => c.status === "Published").length;
                return (
                  <tr key={cat.id} className={cn("transition-colors hover:bg-surface-hover/60", !cat.active && "opacity-60")}>
                    <td className="min-w-[210px] max-w-[250px] py-3 pl-5 pr-3">
                      <div className="flex items-start gap-3">
                        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", cat.color)} />
                        <div className="min-w-0">
                          <button type="button" onClick={() => setEditing(cat)} className="text-left text-sm font-semibold text-foreground hover:text-primary">{cat.name}</button>
                          <p className="truncate text-[11px] text-muted-foreground" title={cat.description}>{cat.description || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1" title={cat.keywords.join(", ")}>
                        {cat.keywords.slice(0, 1).map((k) => <span key={k} className="whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-muted-foreground">{k}</span>)}
                        {cat.keywords.length > 1 && <span className="whitespace-nowrap px-1 text-[10px] text-muted-foreground">+{cat.keywords.length - 1}</span>}
                        {cat.keywords.length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-semibold tabular-nums text-foreground">{s.courses.length}</p>
                      <p className="text-[11px] text-muted-foreground">{published} published</p>
                    </td>
                    <td className="min-w-[180px] px-3 py-3">
                      <p className="mb-1 whitespace-nowrap text-[11px]"><span className="font-semibold tabular-nums text-foreground">{s.apps}</span> <span className="text-muted-foreground">apps ·</span> <span className="font-semibold tabular-nums text-foreground">{s.enrolled}</span> <span className="text-muted-foreground">enrolled{s.apps ? ` (${Math.round((s.enrolled / s.apps) * 100)}%)` : ""}</span></p>
                      <span className="relative block h-1.5 overflow-hidden rounded-full bg-surface-hover">
                        <span className={cn("absolute inset-y-0 left-0 rounded-full opacity-40", cat.color)} style={{ width: `${(s.apps / maxApps) * 100}%` }} />
                        <span className={cn("absolute inset-y-0 left-0 rounded-full", cat.color)} style={{ width: `${(s.enrolled / maxApps) * 100}%` }} />
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-foreground">{formatDay(cat.createdAt)}</p>
                      <p className="text-[11px] text-muted-foreground">{age(cat.createdAt)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <StatusSwitch
                        checked={cat.active}
                        ariaLabel={`${cat.name} active`}
                        onChange={(on) => {
                          setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, active: on } : c)));
                          notify(on ? `${cat.name} is active — it can be chosen for courses` : `${cat.name} is inactive — it can't be chosen for new courses`);
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/courses?category=${cat.id}`} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-semibold text-foreground hover:bg-surface-hover">
                          Courses <ArrowRight className="size-3.5" />
                        </Link>
                        <button type="button" onClick={() => setEditing(cat)} aria-label={`Edit ${cat.name}`} title="Edit" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground"><PencilLine className="size-4" /></button>
                        <button type="button" onClick={() => setDeleting(cat)} aria-label={`Delete ${cat.name}`} title="Delete" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && (
            <div className="px-6 py-4"><EmptyState icon={FolderTree} title="No categories match" body="Try another word, or add a new category." /></div>
          )}
        </div>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary/40" /> Applications</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Enrolled</span>
          <span className="ml-auto">Foundation and pathway keywords win over subject keywords when suggesting a category.</span>
        </footer>
      </Card>

      {editing && (
        <CategoryDialog
          key={editing === "new" ? "new" : editing.id}
          category={editing === "new" ? undefined : editing}
          existing={categories}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            const isNew = !categories.some((x) => x.id === c.id);
            setCategories((prev) => (isNew ? [...prev, c] : prev.map((x) => (x.id === c.id ? c : x))));
            notify(isNew ? `${c.name} added` : `${c.name} saved`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteDialog
          category={deleting}
          courseCount={stats(deleting.id).courses.length}
          others={categories.filter((c) => c.id !== deleting.id)}
          onClose={() => setDeleting(null)}
          onDelete={(moveTo) => {
            if (moveTo) setCourses((prev) => prev.map((c) => (c.categoryId === deleting.id ? { ...c, categoryId: moveTo } : c)));
            setCategories((prev) => prev.filter((c) => c.id !== deleting.id));
            notify(moveTo ? `${deleting.name} deleted — courses moved to ${categories.find((c) => c.id === moveTo)?.name}` : `${deleting.name} deleted`);
            setDeleting(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function CategoryDialog({ category, existing, onClose, onSave }: { category?: CourseCategory; existing: CourseCategory[]; onClose: () => void; onSave: (c: CourseCategory) => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(category?.color ?? colors[existing.length % colors.length]);
  const [keywords, setKeywords] = useState<string[]>(category?.keywords ?? []);
  const [kw, setKw] = useState("");
  const [tried, setTried] = useState(false);
  const clash = existing.some((c) => c.id !== category?.id && c.name.toLowerCase() === name.trim().toLowerCase());
  const nameErr = !name.trim() ? "Enter a name" : clash ? "A category with this name exists" : "";
  const addKw = () => {
    const words = kw.split(",").map((w) => w.trim().toLowerCase()).filter((w) => w && !keywords.includes(w));
    if (words.length) setKeywords([...keywords, ...words]);
    setKw("");
  };
  const save = () => {
    setTried(true);
    if (nameErr) return;
    const id = category?.id ?? (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `cat-${Date.now()}`);
    onSave({
      id: existing.some((c) => c.id === id && c.id !== category?.id) ? `${id}-${Date.now()}` : id,
      name: name.trim(),
      description: description.trim(),
      color,
      keywords,
      createdAt: category?.createdAt ?? new Date().toISOString().slice(0, 10),
      active: category?.active ?? true,
    });
  };
  return (
    <Modal open onClose={onClose} icon={FolderTree} title={category ? `Edit ${category.name}` : "Add category"}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" onClick={save} className={buttonPrimary}>{category ? "Save" : "Add category"}</button></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hospitality & Tourism" aria-invalid={tried && !!nameErr} className={cn(tried && nameErr && "border-danger")} />
          {tried && nameErr && <span className="text-[11px] font-medium text-danger">{nameErr}</span>}
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Which courses belong here?" />
        </Field>
        <Field label="Keywords" hint="Words in a course title that suggest this category. Press Enter to add.">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border p-2">
            {keywords.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-2.5 pr-1 text-xs text-primary">
                {k}
                <button type="button" onClick={() => setKeywords(keywords.filter((x) => x !== k))} aria-label={`Remove ${k}`} className="rounded-full p-0.5 hover:bg-primary/15"><X className="size-3" /></button>
              </span>
            ))}
            <input value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKw(); } }} onBlur={addKw} placeholder={keywords.length ? "Add more…" : "e.g. hospitality, tourism, hotel"} aria-label="Add keyword" className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>
        </Field>
        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => <button key={c} type="button" aria-label={c.replace("bg-", "")} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-surface", c, color === c && "ring-2 ring-foreground")} />)}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

function DeleteDialog({ category, courseCount, others, onClose, onDelete }: { category: CourseCategory; courseCount: number; others: CourseCategory[]; onClose: () => void; onDelete: (moveTo: string) => void }) {
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? "");
  const needsMove = courseCount > 0;
  return (
    <Modal open onClose={onClose} icon={Trash2} size="sm" title={`Delete ${category.name}?`} subtitle={needsMove ? `${courseCount} course${courseCount === 1 ? " uses" : "s use"} this category.` : "No courses use it."}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={needsMove && !moveTo} onClick={() => onDelete(needsMove ? moveTo : "")} className={buttonDanger}>Delete category</button></div>}
    >
      {needsMove ? (
        <Field label="Move its courses to">
          <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {others.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing else is affected.</p>
      )}
    </Modal>
  );
}
