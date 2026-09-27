"use client";

import { HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { useMemo, useState } from "react";
import {
  Link2,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users2,
  X,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import {
  mockWhatsAppAccounts,
  type WhatsAppAccount,
} from "@/lib/mock/whatsapp-accounts";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

export default function WhatsAppAccountsPage() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>(mockWhatsAppAccounts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedForQr, setSelectedForQr] = useState<WhatsAppAccount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New account form state
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountPhone, setNewAccountPhone] = useState("");
  const [newAccountCountry, setNewAccountCountry] = useState<"UK" | "Bangladesh">("Bangladesh");

  const filteredAccounts = useMemo(() => {
    let list = accounts;
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.assignedCounselors.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [accounts, search, statusFilter]);

  const totalConnected = accounts.filter((a) => a.status === "connected").length;
  const totalMessagesToday = accounts.reduce((acc, a) => acc + a.messagesToday, 0);
  const totalConversations = accounts.reduce((acc, a) => acc + a.totalConversations, 0);

  function handleSyncAll() {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setAccounts((prev) =>
        prev.map((a) => (a.status === "connected" ? { ...a, lastSync: "Just now" } : a))
      );
    }, 1200);
  }

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccountName || !newAccountPhone) return;

    const newAcc: WhatsAppAccount = {
      id: `WA-0${accounts.length + 1}`,
      name: newAccountName,
      phone: newAccountPhone,
      country: newAccountCountry,
      status: "connected",
      assignedCounselors: ["Ummay Saiha Limu"],
      messagesToday: 0,
      totalConversations: 0,
      lastSync: "Just now",
      isDefault: false,
      qualityRating: "High",
    };

    setAccounts([newAcc, ...accounts]);
    setNewAccountName("");
    setNewAccountPhone("");
    setConnectModalOpen(false);
  }

  const selection = useRowSelection(filteredAccounts.map((row) => row.id));
  const exportSelected = () =>
    downloadCsv(`whatsapp-accounts-selected.csv`, accounts.filter((row) => selection.isSelected(row.id)).map(toCsvRow));

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            WhatsApp Accounts & Routing
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage linked WhatsApp Business numbers, QR connections, and automated counselor assignment.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className={buttonSecondary}
          >
            <RefreshCw className={cn("size-4 text-muted-foreground", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing..." : "Sync All"}</span>
          </button>
          <button
            type="button"
            onClick={() => setConnectModalOpen(true)}
            className={buttonPrimary}
          >
            <Plus className="size-4" />
            <span>Connect Number</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <StatGrid>
        <StatCard icon={Smartphone} tone="success" label="Connected lines" value={`${totalConnected} / ${accounts.length}`} note="Active" />
        <StatCard icon={MessageSquare} label="Today's messages" value={totalMessagesToday.toLocaleString()} note="In & out" />
        <StatCard icon={Users2} tone="violet" label="Inquiries logged" value={totalConversations.toLocaleString()} note="All-time" />
        <StatCard icon={ShieldCheck} tone="teal" label="API health" value="100%" note="Meta verified" />
      </StatGrid>

      {/* Filter Bar */}
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search hotline or counsellor…" label="Search accounts" />
        <SelectFilter
          label="Status"
          allLabel="All statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "connected", label: "Connected" },
            { value: "qr_required", label: "QR required" },
            { value: "disconnected", label: "Disconnected" },
            { value: "syncing", label: "Syncing" },
          ].map((o) => ({ ...o, hint: accounts.filter((a) => a.status === o.value).length }))}
        />
        {(search || statusFilter) && (
          <ResetFilters
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
          />
        )}
      </FilterBar>

      {/* Accounts Directory Card */}
      <Card className="flex flex-col">
        <CardHeader
          icon={Link2}
          title="Linked Phone Numbers & Hotlines"
          subtitle={`${filteredAccounts.length} account${filteredAccounts.length === 1 ? "" : "s"} match your filters`}
        />

        {/* Accounts Table */}
        <SelectionBar selection={selection} noun={["account", "accounts"]} onExport={exportSelected} className="mx-4 mb-3 sm:mx-6" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 py-2.5 pl-6 pr-0">
                  <HeaderCheckbox selection={selection} />
                </th>
                <th className="py-3 pl-3 pr-3 font-semibold">Account & Hotline</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Assigned Counselors</th>
                <th className="px-3 py-3 font-semibold">Messages Today</th>
                <th className="px-3 py-3 font-semibold">Last Sync</th>
                <th className="py-3 pl-3 pr-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className={cn("group transition-colors hover:bg-surface-muted/40", selectedRowClass(selection, acc.id))}>
                  <td className="py-3 pl-6 pr-0 align-middle">
                    <RowCheckbox selection={selection} id={acc.id} label={`Select ${acc.name}`} />
                  </td>
                  <td className="py-3.5 pl-3 pr-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                        <Smartphone className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{acc.name}</span>
                          {acc.isDefault && (
                            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground">{acc.phone}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    {acc.status === "connected" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="size-1.5 rounded-full bg-success animate-pulse" />
                        Connected
                      </span>
                    ) : acc.status === "qr_required" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedForQr(acc)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-700/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-700/15 dark:bg-amber-500/10 dark:text-amber-400"
                      >
                        <QrCode className="size-3" />
                        Scan QR Code
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-700/10 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                        Disconnected
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex items-center gap-1">
                      {acc.assignedCounselors.map((c) => (
                        <span
                          key={c}
                          title={c}
                          className="flex size-6 items-center justify-center rounded-full bg-surface-muted border border-border text-[10px] font-semibold text-foreground -ml-1 first:ml-0"
                        >
                          {c[0]}
                        </span>
                      ))}
                      <span className="text-[11px] text-muted-foreground ml-1.5">
                        {acc.assignedCounselors.join(", ")}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 align-middle">
                    <span className="font-semibold text-foreground tabular-nums">
                      {acc.messagesToday.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-1">msgs</span>
                  </td>

                  <td className="px-3 py-3.5 align-middle text-muted-foreground text-[11px]">
                    {acc.lastSync}
                  </td>

                  <td className="py-3.5 pl-3 pr-6 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {acc.status === "qr_required" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedForQr(acc)}
                          className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover"
                        >
                          Re-Link
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAccounts((prev) =>
                              prev.map((a) => (a.id === acc.id ? { ...a, lastSync: "Just now" } : a))
                            );
                          }}
                          className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-surface-hover"
                        >
                          Sync
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Connect Number Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 card-shadow">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-success/10 text-success">
                  <QrCode className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">Connect WhatsApp Business</h3>
                  <p className="text-xs text-muted-foreground">Scan QR code or connect official Meta API</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Line / Branch Label <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g. BHE Chittagong Hotline"
                  className="mt-1.5 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Region</label>
                  <div className="relative mt-1.5">
                    <select
                      value={newAccountCountry}
                      onChange={(e) => setNewAccountCountry(e.target.value as "UK" | "Bangladesh")}
                      className="h-9 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="Bangladesh">Bangladesh (+880)</option>
                      <option value="UK">United Kingdom (+44)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountPhone}
                    onChange={(e) => setNewAccountPhone(e.target.value)}
                    placeholder="+880 1711 000000"
                    className="mt-1.5 h-9 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Simulated QR Code Box */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface-muted/40 p-6 text-center">
                <div className="relative flex size-36 items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-border">
                  <div className="grid grid-cols-6 gap-1 w-full h-full bg-slate-900 rounded p-1">
                    <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-white col-span-2 row-span-1 rounded-xs" />
                    <div className="bg-white col-span-2 row-span-2 rounded-xs" />
                    <div className="bg-white col-span-1 row-span-2 rounded-xs" />
                    <div className="bg-success col-span-2 row-span-2 rounded-xs animate-pulse" />
                    <div className="bg-white col-span-3 row-span-1 rounded-xs" />
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium text-foreground">
                  Open WhatsApp on your device &gt; Linked Devices &gt; Scan Code
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Code refreshes automatically every 30 seconds
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className={buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={buttonPrimary}
                >
                  Confirm & Link Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconnect QR Modal */}
      {selectedForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 card-shadow text-center">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForQr(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-600/10 text-amber-600">
              <QrCode className="size-6" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">Re-Authenticate WhatsApp</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Session for <strong>{selectedForQr.name}</strong> expired. Scan QR below to resume live sync.
            </p>

            <div className="mt-4 flex size-44 mx-auto items-center justify-center rounded-2xl bg-white p-3 shadow-xs border border-border">
              <div className="grid grid-cols-6 gap-1 w-full h-full bg-slate-900 rounded p-1">
                <div className="bg-white col-span-2 row-span-2" />
                <div className="bg-amber-500 col-span-2 row-span-2 animate-pulse" />
                <div className="bg-white col-span-2 row-span-2" />
                <div className="bg-white col-span-3 row-span-2" />
                <div className="bg-white col-span-3 row-span-2" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAccounts((prev) =>
                  prev.map((a) => (a.id === selectedForQr.id ? { ...a, status: "connected" } : a))
                );
                setSelectedForQr(null);
              }}
              className="mt-5 w-full rounded-full bg-success py-2.5 text-xs font-semibold text-white hover:bg-success/90"
            >
              Simulate QR Scanned & Connected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
