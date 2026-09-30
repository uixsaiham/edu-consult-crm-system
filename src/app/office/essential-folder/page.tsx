"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import {
  Clock3,
  Copy,
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder as FolderIcon,
  FolderInput,
  FolderPlus,
  HardDrive,
  LayoutGrid,
  List,
  MoreHorizontal,
  PencilLine,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { EmptyState } from "@/components/office/office-ui";
import { extOf, formatSize, getFiles, getFolders, officeNow, saveFiles, saveFolders, type Folder, type OfficeFile } from "@/lib/mock/office";
import { cn } from "@/lib/utils";

type View = "all" | "starred" | "recent" | string;
type Sort = "updated" | "name" | "size";
const QUOTA = 5 * 1024 * 1024 * 1024;
const folderColors = ["bg-primary", "bg-rose-500", "bg-teal-500", "bg-violet-500", "bg-amber-500", "bg-sky-500", "bg-emerald-500"];
const textExts = new Set(["txt", "csv", "md", "json"]);

function fileIcon(name: string) {
  const ext = extOf(name);
  if (ext === "pdf") return { Icon: FileText, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  if (ext === "csv" || ext === "xlsx" || ext === "xls") return { Icon: FileSpreadsheet, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return { Icon: FileImage, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" };
  if (ext === "doc" || ext === "docx") return { Icon: FileText, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" };
  return { Icon: FileText, tone: "bg-surface-hover text-muted-foreground" };
}

function download(f: OfficeFile) {
  const href = f.url ?? URL.createObjectURL(new Blob([f.content ?? ""], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = href;
  a.download = f.name;
  a.click();
  if (!f.url) URL.revokeObjectURL(href);
}

export default function EssentialFolderPage() {
  const { user } = useUser();
  const [folders, setFolders] = useState<Folder[]>(getFolders);
  const [files, setFiles] = useState<OfficeFile[]>(getFiles);
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: "rename" | "move" | "delete"; id: string } | { kind: "folder"; folder?: Folder } | { kind: "delete-folder"; folder: Folder } | null>(null);
  const [toast, notify] = useToast();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => saveFiles(files), [files]);
  useEffect(() => saveFolders(folders), [folders]);

  const folderOf = (id: string) => folders.find((f) => f.id === id);
  const currentFolder = folderOf(view);
  const recentCutoff = Date.parse(officeNow) - 14 * 86400000;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files
      .filter(
        (f) =>
          (view === "all" || (view === "starred" ? f.starred : view === "recent" ? Date.parse(f.updatedAt) >= recentCutoff : f.folderId === view)) &&
          (!tag || f.tags.includes(tag)) &&
          (!q || `${f.name} ${f.tags.join(" ")} ${f.updatedBy} ${f.content ?? ""}`.toLowerCase().includes(q))
      )
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : sort === "size" ? b.size - a.size : b.updatedAt.localeCompare(a.updatedAt)));
  }, [files, view, tag, search, sort, recentCutoff]);

  const tags = [...new Set(files.flatMap((f) => f.tags))].sort();
  const used = files.reduce((n, f) => n + f.size, 0);
  const title = currentFolder?.name ?? (view === "starred" ? "Starred" : view === "recent" ? "Recently updated" : "All files");

  const upload = async (list: FileList | File[]) => {
    const target = currentFolder?.id ?? folders[0]?.id;
    if (!target) return notify("Create a folder first", "error");
    const added: OfficeFile[] = [];
    for (const file of Array.from(list)) {
      if (file.size > 25 * 1024 * 1024) {
        notify(`${file.name} is over 25 MB`, "error");
        continue;
      }
      const isText = textExts.has(extOf(file.name));
      added.push({
        id: `F-${Date.now()}-${added.length}`,
        folderId: target,
        name: file.name,
        size: file.size,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name,
        tags: [],
        starred: false,
        url: isText ? undefined : URL.createObjectURL(file),
        content: isText ? await file.text() : undefined,
      });
    }
    if (!added.length) return;
    setFiles((prev) => [...added, ...prev]);
    notify(added.length === 1 ? `${added[0].name} uploaded to ${folderOf(target)?.name}` : `${added.length} files uploaded to ${folderOf(target)?.name}`);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
  };

  const patch = (id: string, p: Partial<OfficeFile>) => setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));
  const toggleStar = (f: OfficeFile) => {
    patch(f.id, { starred: !f.starred });
    notify(f.starred ? "Removed from starred" : "Starred — find it under Starred");
  };
  const copyLink = async (f: OfficeFile) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/office/essential-folder?file=${f.id}`);
      notify("Link copied");
    } catch {
      notify("Couldn't copy the link", "error");
    }
  };

  const preview = files.find((f) => f.id === previewId);
  const target = dialog && "id" in dialog ? files.find((f) => f.id === dialog.id) : undefined;

  const menu = (f: OfficeFile) => (
    <AnchoredMenu label={`Actions for ${f.name}`} align="end" width={190} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
      {(close) => (
        <>
          <MenuItem icon={Eye} onClick={() => { close(); setPreviewId(f.id); }}>Preview</MenuItem>
          <MenuItem icon={Download} onClick={() => { close(); download(f); }}>Download</MenuItem>
          <MenuItem icon={Copy} onClick={() => { close(); void copyLink(f); }}>Copy link</MenuItem>
          <MenuItem icon={Star} onClick={() => { close(); toggleStar(f); }}>{f.starred ? "Unstar" : "Star"}</MenuItem>
          <MenuDivider />
          <MenuItem icon={PencilLine} onClick={() => { close(); setDialog({ kind: "rename", id: f.id }); }}>Rename & tags</MenuItem>
          <MenuItem icon={FolderInput} onClick={() => { close(); setDialog({ kind: "move", id: f.id }); }}>Move to…</MenuItem>
          <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDialog({ kind: "delete", id: f.id }); }}>Delete</MenuItem>
        </>
      )}
    </AnchoredMenu>
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Essential Folder</h2>
          <p className="mt-1 text-sm text-muted-foreground">The documents every branch needs — checklists, templates, policies and university guides, always the latest version.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog({ kind: "folder" })} className={buttonSecondary}><FolderPlus className="size-4" /> New folder</button>
          <button type="button" onClick={() => input.current?.click()} className={buttonPrimary}><UploadCloud className="size-4" /> Upload</button>
          <input ref={input} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = ""; }} />
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3">
          <Card className="p-2">
            <nav aria-label="Folders" className="flex flex-col gap-0.5">
              {[
                { id: "all", label: "All files", icon: HardDrive, count: files.length },
                { id: "starred", label: "Starred", icon: Star, count: files.filter((f) => f.starred).length },
                { id: "recent", label: "Recently updated", icon: Clock3, count: files.filter((f) => Date.parse(f.updatedAt) >= recentCutoff).length },
              ].map((n) => (
                <NavRow key={n.id} active={view === n.id} onClick={() => setView(n.id)} label={n.label} count={n.count} icon={<n.icon className="size-4" />} />
              ))}
              <p className="mt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Folders</p>
              {folders.map((f) => (
                <NavRow key={f.id} active={view === f.id} onClick={() => setView(f.id)} label={f.name} count={files.filter((x) => x.folderId === f.id).length} icon={<span className={cn("size-2.5 rounded-sm", f.color)} />} />
              ))}
            </nav>
          </Card>
          <Card className="p-4">
            <p className="flex justify-between text-[11px] text-muted-foreground"><span>Storage</span><span className="tabular-nums">{formatSize(used)} of 5 GB</span></p>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface-hover"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(1, (used / QUOTA) * 100)}%` }} /></span>
          </Card>
        </aside>

        <section
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
          onDrop={onDrop}
          className={cn("relative flex min-w-0 flex-col gap-3 rounded-3xl transition-colors", dragging && "outline-2 outline-dashed outline-offset-4 outline-primary")}
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-primary-soft/80 text-sm font-semibold text-primary">
              <UploadCloud className="mr-2 size-5" /> Drop to upload to {currentFolder?.name ?? folders[0]?.name}
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                {currentFolder ? <span className={cn("size-3 rounded", currentFolder.color)} /> : null}
                {title}
                <span className="text-xs font-normal text-muted-foreground">· {shown.length} file{shown.length === 1 ? "" : "s"}</span>
              </h3>
              {currentFolder && <p className="text-xs text-muted-foreground">{currentFolder.description}</p>}
            </div>
            {currentFolder && (
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setDialog({ kind: "folder", folder: currentFolder })} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><PencilLine className="size-3.5" /> Edit folder</button>
                <button type="button" onClick={() => setDialog({ kind: "delete-folder", folder: currentFolder })} aria-label="Delete folder" className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-danger-soft hover:text-danger"><Trash2 className="size-3.5" /></button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
            <SearchField value={search} onChange={setSearch} placeholder="Search names, tags and contents…" label="Search files" />
            <SelectFilter label="Tag" value={tag} onChange={setTag} allLabel="All tags" options={tags} />
            <SelectFilter label="Sort" value={sort === "updated" ? "" : sort} onChange={(v) => setSort((v || "updated") as Sort)} allLabel="Last updated" options={[{ value: "name", label: "Name A–Z" }, { value: "size", label: "Largest first" }]} />
            {(search || tag || sort !== "updated") && <ResetFilters onClick={() => { setSearch(""); setTag(""); setSort("updated"); }} />}
            <div className={cn("inline-flex rounded-lg border border-border p-0.5", !(search || tag || sort !== "updated") && "ml-auto")}>
              {(["list", "grid"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={layout === l} aria-label={`${l} view`} onClick={() => setLayout(l)} className={cn("flex size-8 items-center justify-center rounded-md", layout === l ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {l === "list" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={view === "starred" ? Star : FolderIcon}
              title={search || tag ? "No files match" : view === "starred" ? "Nothing starred yet" : "This folder is empty"}
              body={search || tag ? "Try another search or tag." : view === "starred" ? "Star the files you use most to find them here." : "Upload files or drag them here."}
              action={!search && !tag && view !== "starred" ? <button type="button" onClick={() => input.current?.click()} className={buttonSecondary}><UploadCloud className="size-4" /> Upload files</button> : undefined}
            />
          ) : layout === "list" ? (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-border">
                {shown.map((f) => {
                  const { Icon, tone } = fileIcon(f.name);
                  const folder = folderOf(f.folderId);
                  return (
                    <li key={f.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover/60">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" /></span>
                      <button type="button" onClick={() => setPreviewId(f.id)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{f.name}</span>
                        <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                          {!currentFolder && folder && <span className="inline-flex items-center gap-1"><span className={cn("size-2 rounded-sm", folder.color)} />{folder.name}</span>}
                          <span>{formatSize(f.size)}</span>
                          <span>Updated {formatDay(f.updatedAt)} by {f.updatedBy}</span>
                        </span>
                      </button>
                      <div className="hidden max-w-[220px] flex-wrap justify-end gap-1 md:flex">
                        {f.tags.map((t) => (
                          <button key={t} type="button" onClick={() => setTag(t)} className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground">{t}</button>
                        ))}
                      </div>
                      <button type="button" onClick={() => toggleStar(f)} aria-label={f.starred ? `Unstar ${f.name}` : `Star ${f.name}`} className={cn("flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-surface-hover", f.starred ? "text-amber-500" : "text-muted-foreground/50 hover:text-muted-foreground")}>
                        <Star className={cn("size-4", f.starred && "fill-current")} />
                      </button>
                      <button type="button" onClick={() => download(f)} aria-label={`Download ${f.name}`} className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground sm:flex"><Download className="size-4" /></button>
                      {menu(f)}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {shown.map((f) => {
                const { Icon, tone } = fileIcon(f.name);
                return (
                  <div key={f.id} className="card-shadow group flex flex-col rounded-2xl border border-border bg-surface p-3">
                    <button type="button" onClick={() => setPreviewId(f.id)} className={cn("relative flex aspect-[4/3] items-center justify-center rounded-xl", tone)}>
                      <Icon className="size-8" />
                      {f.starred && <Star className="absolute right-2 top-2 size-3.5 fill-amber-500 text-amber-500" />}
                    </button>
                    <div className="mt-2.5 flex items-start gap-1">
                      <button type="button" onClick={() => setPreviewId(f.id)} className="min-w-0 flex-1 text-left">
                        <span className="line-clamp-2 text-xs font-semibold text-foreground group-hover:text-primary">{f.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{formatSize(f.size)} · {formatDay(f.updatedAt)}</span>
                      </button>
                      {menu(f)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {preview && <Preview file={preview} folder={folderOf(preview.folderId)} onClose={() => setPreviewId(null)} onStar={() => toggleStar(preview)} />}

      {dialog?.kind === "rename" && target && (
        <RenameDialog file={target} onClose={() => setDialog(null)} onSave={(name, tags) => { patch(target.id, { name, tags, updatedAt: new Date().toISOString(), updatedBy: user.name }); notify("File updated"); setDialog(null); }} />
      )}
      {dialog?.kind === "move" && target && (
        <MoveDialog file={target} folders={folders} onClose={() => setDialog(null)} onMove={(folderId) => { patch(target.id, { folderId }); notify(`Moved to ${folderOf(folderId)?.name}`); setDialog(null); }} />
      )}
      {dialog?.kind === "delete" && target && (
        <Modal open onClose={() => setDialog(null)} icon={Trash2} size="sm" title={`Delete ${target.name}?`} subtitle="Everyone loses access to it. This can't be undone."
          footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setFiles((prev) => prev.filter((f) => f.id !== target.id)); notify(`${target.name} deleted`); setDialog(null); }} className={buttonDanger}>Delete file</button></div>}
        >
          <p className="text-sm text-muted-foreground">If this is an outdated version, consider renaming the new file instead so links keep working.</p>
        </Modal>
      )}
      {dialog?.kind === "folder" && (
        <FolderDialog folder={dialog.folder} existing={folders} onClose={() => setDialog(null)} onSave={(f) => {
          const isNew = !folders.some((x) => x.id === f.id);
          setFolders((prev) => (isNew ? [...prev, f] : prev.map((x) => (x.id === f.id ? f : x))));
          if (isNew) setView(f.id);
          notify(isNew ? `Folder "${f.name}" created` : "Folder saved");
          setDialog(null);
        }} />
      )}
      {dialog?.kind === "delete-folder" && (() => {
        const count = files.filter((f) => f.folderId === dialog.folder.id).length;
        return (
          <Modal open onClose={() => setDialog(null)} icon={Trash2} size="sm" title={`Delete "${dialog.folder.name}"?`} subtitle={count ? "Move or delete its files first." : "The folder is empty."}
            footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDialog(null)} className={buttonSecondary}>Cancel</button><button type="button" disabled={count > 0} onClick={() => { setFolders((prev) => prev.filter((f) => f.id !== dialog.folder.id)); setView("all"); notify("Folder deleted"); setDialog(null); }} className={buttonDanger}>Delete folder</button></div>}
          >
            <p className="text-sm text-muted-foreground">{count ? `It still holds ${count} file${count === 1 ? "" : "s"}. Folders can only be deleted when empty, so nothing is lost by accident.` : "Nothing else is affected."}</p>
          </Modal>
        );
      })()}
      {toast}
    </div>
  );
}

function NavRow({ active, onClick, label, count, icon }: { active: boolean; onClick: () => void; label: string; count: number; icon: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors", active ? "bg-primary-soft font-semibold text-primary" : "font-medium text-foreground hover:bg-surface-hover")}>
      <span className={cn("flex size-4 shrink-0 items-center justify-center", !active && "text-muted-foreground")}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{count}</span>
    </button>
  );
}

function Preview({ file: f, folder, onClose, onStar }: { file: OfficeFile; folder?: Folder; onClose: () => void; onStar: () => void }) {
  const ext = extOf(f.name);
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  const rows = ext === "csv" && f.content ? f.content.trim().split("\n").map((r) => r.split(",")) : null;
  return (
    <Modal
      open
      onClose={onClose}
      icon={fileIcon(f.name).Icon}
      size="lg"
      title={f.name}
      subtitle={`${folder?.name ?? "—"} · ${formatSize(f.size)} · updated ${formatDay(f.updatedAt)} by ${f.updatedBy}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">{f.tags.map((t) => <span key={t} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>)}</div>
          <div className="flex gap-2">
            <button type="button" onClick={onStar} className={buttonSecondary}><Star className={cn("size-4", f.starred && "fill-amber-500 text-amber-500")} /> {f.starred ? "Starred" : "Star"}</button>
            <button type="button" onClick={() => download(f)} className={buttonPrimary}><Download className="size-4" /> Download</button>
          </div>
        </div>
      }
    >
      {f.url && ext === "pdf" ? (
        <iframe src={`${f.url}#view=FitH`} title={f.name} className="h-[62vh] w-full rounded-xl border border-border" />
      ) : f.url && isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- session uploads are blob URLs
        <img src={f.url} alt={f.name} className="mx-auto max-h-[62vh] rounded-xl object-contain" />
      ) : rows ? (
        <div className="max-h-[62vh] overflow-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-muted text-[11px] font-semibold text-muted-foreground"><tr>{rows[0].map((h, i) => <th key={i} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{rows.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2 text-foreground">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : f.content !== undefined ? (
        <pre className="max-h-[62vh] overflow-auto whitespace-pre-wrap rounded-xl bg-surface-muted p-4 font-sans text-sm leading-relaxed text-foreground">{f.content}</pre>
      ) : (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No preview for .{ext || "this"} files</p>
          <p className="text-xs text-muted-foreground">Download it to open in the right app.</p>
        </div>
      )}
    </Modal>
  );
}

function RenameDialog({ file, onClose, onSave }: { file: OfficeFile; onClose: () => void; onSave: (name: string, tags: string[]) => void }) {
  const ext = extOf(file.name);
  const [base, setBase] = useState(ext ? file.name.slice(0, -(ext.length + 1)) : file.name);
  const [tags, setTags] = useState(file.tags.join(", "));
  return (
    <Modal open onClose={onClose} icon={PencilLine} size="sm" title="Rename & tag"
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!base.trim()} onClick={() => onSave(`${base.trim()}${ext ? `.${ext}` : ""}`, tags.split(",").map((t) => t.trim()).filter(Boolean))} className={buttonPrimary}>Save</button></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="File name" hint={ext ? `The .${ext} extension is kept.` : undefined}>
          <TextInput value={base} onChange={(e) => setBase(e.target.value)} />
        </Field>
        <Field label="Tags" hint="Separate with commas, e.g. UKVI, Checklist">
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function MoveDialog({ file, folders, onClose, onMove }: { file: OfficeFile; folders: Folder[]; onClose: () => void; onMove: (folderId: string) => void }) {
  const [to, setTo] = useState(file.folderId);
  return (
    <Modal open onClose={onClose} icon={FolderInput} size="sm" title={`Move ${file.name}`}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={to === file.folderId} onClick={() => onMove(to)} className={buttonPrimary}>Move</button></div>}
    >
      <Field label="Folder">
        <Select value={to} onChange={(e) => setTo(e.target.value)}>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}{f.id === file.folderId ? " (current)" : ""}</option>)}
        </Select>
      </Field>
    </Modal>
  );
}

function FolderDialog({ folder, existing, onClose, onSave }: { folder?: Folder; existing: Folder[]; onClose: () => void; onSave: (f: Folder) => void }) {
  const [name, setName] = useState(folder?.name ?? "");
  const [description, setDescription] = useState(folder?.description ?? "");
  const [color, setColor] = useState(folder?.color ?? folderColors[existing.length % folderColors.length]);
  const clash = existing.some((f) => f.id !== folder?.id && f.name.toLowerCase() === name.trim().toLowerCase());
  return (
    <Modal open onClose={onClose} icon={FolderPlus} size="sm" title={folder ? "Edit folder" : "New folder"}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!name.trim() || clash} onClick={() => onSave({ id: folder?.id ?? `fld-${Date.now()}`, name: name.trim(), description: description.trim(), color })} className={buttonPrimary}>{folder ? "Save" : "Create folder"}</button></div>}
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" hint={clash ? "A folder with this name already exists" : undefined}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Canada guides" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What belongs in this folder?" />
        </Field>
        <Field label="Colour">
          <div className="flex gap-2">
            {folderColors.map((c) => (
              <button key={c} type="button" aria-label={c.replace("bg-", "")} aria-pressed={color === c} onClick={() => setColor(c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-surface transition-shadow", c, color === c && "ring-2 ring-foreground")} />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
