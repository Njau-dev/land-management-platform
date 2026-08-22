"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AdminBadge,
  AdminEmpty,
  AdminError,
  AdminLoading,
  AdminPageHeader,
  AdminPagination,
  ConfirmDialog,
  formatAdminDate,
  formatAdminKes,
  humanize,
} from "@/components/admin/admin-ui";
import {
  createAdminRecordRequest,
  deleteAdminRecordRequest,
  getAdminRecordRequest,
  getTitleDeedOptionsRequest,
  listAdminRecordsRequest,
  updateAdminRecordRequest,
} from "@/features/admin/admin.api";
import {
  getAdminErrorMessage,
  isAdminForbidden,
} from "@/features/admin/admin.errors";
import type {
  AdminLoan,
  AdminOwnershipHistory,
  AdminRecord,
  AdminResource,
  AdminTitleDeed,
  AdminZoning,
  Pagination,
  TitleDeedSummary,
} from "@/features/admin/admin.types";
import { useAuth } from "@/features/auth/use-auth";

type FieldType = "text" | "decimal" | "date" | "textarea" | "select" | "title-deed";
interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
}
interface FilterConfig {
  name: string;
  label: string;
  options: readonly string[];
}
interface ResourceConfig<T extends AdminRecord> {
  resource: AdminResource;
  eyebrow: string;
  title: string;
  singular: string;
  description: string;
  searchPlaceholder: string;
  fields: FieldConfig[];
  filters: FilterConfig[];
  columns: Array<{ label: string; render: (record: T) => ReactNode }>;
}

const availability = ["AVAILABLE", "SOLD", "UNDER_TRANSACTION"] as const;
const zoneTypes = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED_USE", "OTHER"] as const;
const loanTypes = ["LOAN", "LIEN", "OTHER"] as const;
const loanStatuses = ["CLEAR", "ACTIVE", "OVERDUE"] as const;

const titleDeedConfig: ResourceConfig<AdminTitleDeed> = {
  resource: "title-deeds",
  eyebrow: "Synthetic land dataset",
  title: "Title deeds",
  singular: "title deed",
  description: "Create and maintain the core title deed records used by subscriber searches.",
  searchPlaceholder: "Search number, owner, or location",
  fields: [
    { name: "titleDeedNumber", label: "Title deed number", type: "text", required: true, placeholder: "SYNTH/NRB/KAS/001/2026" },
    { name: "ownerName", label: "Current owner", type: "text", required: true },
    { name: "location", label: "Location", type: "text", required: true },
    { name: "size", label: "Parcel size (unit unspecified)", type: "decimal", required: true, placeholder: "0.1250" },
    { name: "availabilityStatus", label: "Availability", type: "select", required: true, options: availability },
    { name: "landRate", label: "Estimated land rate (KES)", type: "decimal", required: true, placeholder: "8500000.00" },
  ],
  filters: [{ name: "availabilityStatus", label: "All availability", options: availability }],
  columns: [
    { label: "Title deed", render: (record) => <><p className="font-mono font-bold">{record.titleDeedNumber}</p><p className="mt-1 text-xs text-stone-500">{record.location}</p></> },
    { label: "Owner", render: (record) => record.ownerName },
    { label: "Availability", render: (record) => <AdminBadge value={record.availabilityStatus} /> },
    { label: "Parcel / rate", render: (record) => <><p>{record.size}</p><p className="mt-1 text-xs text-stone-500">{formatAdminKes(record.landRate)}</p></> },
    { label: "Related", render: (record) => <span className="text-xs text-stone-600">{record.zoningInfo ? "Zoning · " : ""}{record._count.loansLiens} loans · {record._count.ownershipHistory} owners</span> },
  ],
};

const zoningConfig: ResourceConfig<AdminZoning> = {
  resource: "zoning",
  eyebrow: "Planning information",
  title: "Zoning",
  singular: "zoning record",
  description: "Maintain one current zoning classification and its restrictions for each title deed.",
  searchPlaceholder: "Search title deed, owner, or notes",
  fields: [
    { name: "titleDeedId", label: "Title deed", type: "title-deed", required: true },
    { name: "zoneType", label: "Zone classification", type: "select", required: true, options: zoneTypes },
    { name: "notes", label: "Notes", type: "textarea" },
    { name: "restrictions", label: "Restrictions", type: "textarea" },
  ],
  filters: [{ name: "zoneType", label: "All zone types", options: zoneTypes }],
  columns: [
    { label: "Title deed", render: (record) => <><p className="font-mono font-bold">{record.titleDeed.titleDeedNumber}</p><p className="mt-1 text-xs text-stone-500">{record.titleDeed.location}</p></> },
    { label: "Classification", render: (record) => <AdminBadge value={record.zoneType} /> },
    { label: "Notes", render: (record) => <span className="line-clamp-2 max-w-xs text-stone-600">{record.notes ?? "No notes"}</span> },
    { label: "Restrictions", render: (record) => <span className="line-clamp-2 max-w-xs text-stone-600">{record.restrictions ?? "None recorded"}</span> },
  ],
};

const loansConfig: ResourceConfig<AdminLoan> = {
  resource: "loans",
  eyebrow: "Recorded interests",
  title: "Loans & liens",
  singular: "loan or lien",
  description: "Manage the financing and lien records associated with title deeds in the development dataset.",
  searchPlaceholder: "Search lender or title deed",
  fields: [
    { name: "titleDeedId", label: "Title deed", type: "title-deed", required: true },
    { name: "type", label: "Record type", type: "select", required: true, options: loanTypes },
    { name: "lender", label: "Lender / holder", type: "text", required: true },
    { name: "amount", label: "Recorded amount (KES)", type: "decimal", required: true, placeholder: "450000.00" },
    { name: "status", label: "Status", type: "select", required: true, options: loanStatuses },
    { name: "dueDate", label: "Due date", type: "date" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
  filters: [
    { name: "status", label: "All statuses", options: loanStatuses },
    { name: "type", label: "All record types", options: loanTypes },
  ],
  columns: [
    { label: "Title deed", render: (record) => <p className="font-mono font-bold">{record.titleDeed.titleDeedNumber}</p> },
    { label: "Lender", render: (record) => record.lender },
    { label: "Type / status", render: (record) => <div className="flex flex-wrap gap-2"><AdminBadge value={record.type} /><AdminBadge value={record.status} /></div> },
    { label: "Amount", render: (record) => <span className="font-bold">{formatAdminKes(record.amount)}</span> },
    { label: "Due date", render: (record) => formatAdminDate(record.dueDate) },
  ],
};

const ownershipConfig: ResourceConfig<AdminOwnershipHistory> = {
  resource: "ownership-history",
  eyebrow: "Recorded history",
  title: "Ownership history",
  singular: "ownership record",
  description: "Maintain chronological historical ownership entries without changing the title deed's current owner field.",
  searchPlaceholder: "Search owner or title deed",
  fields: [
    { name: "titleDeedId", label: "Title deed", type: "title-deed", required: true },
    { name: "ownerName", label: "Historical owner", type: "text", required: true },
    { name: "transferDate", label: "Transfer date", type: "date", required: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
  filters: [],
  columns: [
    { label: "Title deed", render: (record) => <p className="font-mono font-bold">{record.titleDeed.titleDeedNumber}</p> },
    { label: "Historical owner", render: (record) => record.ownerName },
    { label: "Transfer date", render: (record) => formatAdminDate(record.transferDate) },
    { label: "Notes", render: (record) => <span className="line-clamp-2 max-w-md text-stone-600">{record.notes ?? "No notes"}</span> },
  ],
};

export function AdminResourceManager<T extends AdminRecord>({ config }: { config: ResourceConfig<T> }) {
  const { refreshUser } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<T | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [titleDeeds, setTitleDeeds] = useState<TitleDeedSummary[]>([]);

  const needsTitleDeeds = config.fields.some((field) => field.type === "title-deed");
  const query = useMemo(
    () => ({ page, limit: 20, search, ...filters }),
    [filters, page, search],
  );

  const handleForbidden = useCallback(async (requestError: unknown) => {
    if (isAdminForbidden(requestError)) await refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    let cancelled = false;
    void listAdminRecordsRequest<T>(config.resource, query)
      .then((response) => {
        if (cancelled) return;
        setItems(response.items);
        setPagination(response.pagination);
        setStatus("ready");
        setError(null);
      })
      .catch(async (loadError: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(getAdminErrorMessage(loadError));
        await handleForbidden(loadError);
      });
    return () => { cancelled = true; };
  }, [config.resource, handleForbidden, query, reloadKey]);

  useEffect(() => {
    if (!needsTitleDeeds) return;
    let cancelled = false;
    void getTitleDeedOptionsRequest()
      .then((records) => { if (!cancelled) setTitleDeeds(records); })
      .catch(async (loadError: unknown) => {
        if (!cancelled) setActionError(getAdminErrorMessage(loadError, "Title deed options could not be loaded."));
        await handleForbidden(loadError);
      });
    return () => { cancelled = true; };
  }, [handleForbidden, needsTitleDeeds]);

  function refreshList() {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(draftSearch.trim());
    setStatus("loading");
  }

  function emptyForm(): Record<string, string> {
    return Object.fromEntries(config.fields.map((field) => [field.name, field.options?.[0] ?? ""]));
  }

  function createRecord() {
    setEditingId(null);
    setFormValues(emptyForm());
    setFormError(null);
    setFormOpen(true);
  }

  async function editRecord(record: T) {
    setFormBusy(true);
    setFormError(null);
    setEditingId(record.id);
    setFormValues({});
    setFormOpen(true);
    try {
      const detail = await getAdminRecordRequest<T>(config.resource, record.id);
      const values = emptyForm();
      for (const field of config.fields) {
        const raw = (detail as unknown as Record<string, unknown>)[field.name];
        values[field.name] =
          field.type === "date" && typeof raw === "string"
            ? raw.slice(0, 10)
            : raw === null || raw === undefined
              ? ""
              : String(raw);
      }
      setFormValues(values);
    } catch (detailError) {
      setFormOpen(false);
      setActionError(getAdminErrorMessage(detailError));
      await handleForbidden(detailError);
    } finally {
      setFormBusy(false);
    }
  }

  function buildPayload(): Record<string, unknown> | null {
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = formValues[field.name]?.trim() ?? "";
      if (field.required && !value) {
        setFormError(`${field.label} is required.`);
        return null;
      }
      if (field.type === "decimal" && value && !/^\d+(?:\.\d+)?$/.test(value)) {
        setFormError(`${field.label} must be a decimal number.`);
        return null;
      }
      if (field.type === "textarea" || (field.type === "date" && !field.required)) {
        payload[field.name] = value || null;
      } else {
        payload[field.name] = value;
      }
    }
    return payload;
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formBusy) return;
    setFormError(null);
    const payload = buildPayload();
    if (!payload) return;
    setFormBusy(true);
    try {
      if (editingId) {
        await updateAdminRecordRequest<T>(config.resource, editingId, payload);
      } else {
        await createAdminRecordRequest<T>(config.resource, payload);
      }
      setFormOpen(false);
      refreshList();
      if (needsTitleDeeds) {
        setTitleDeeds(await getTitleDeedOptionsRequest());
      }
    } catch (mutationError) {
      setFormError(getAdminErrorMessage(mutationError));
      await handleForbidden(mutationError);
    } finally {
      setFormBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteRecord || deleteBusy) return;
    setDeleteBusy(true);
    setActionError(null);
    try {
      await deleteAdminRecordRequest(config.resource, deleteRecord.id);
      setDeleteRecord(null);
      refreshList();
      if (needsTitleDeeds) setTitleDeeds(await getTitleDeedOptionsRequest());
    } catch (deleteError) {
      setActionError(getAdminErrorMessage(deleteError));
      setDeleteRecord(null);
      await handleForbidden(deleteError);
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={<button type="button" onClick={createRecord} className="h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">Add {config.singular}</button>}
      />
      <form onSubmit={submitSearch} className="mt-8 flex flex-col gap-3 border border-stone-200 bg-white p-4 md:flex-row" aria-label={`Filter ${config.title}`}>
        <label className="sr-only" htmlFor={`${config.resource}-search`}>Search {config.title}</label>
        <input id={`${config.resource}-search`} value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder={config.searchPlaceholder} className="h-11 min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15" />
        {config.filters.map((filter) => (
          <select key={filter.name} aria-label={filter.label} value={filters[filter.name] ?? ""} onChange={(event) => { setFilters((current) => ({ ...current, [filter.name]: event.target.value })); setPage(1); setStatus("loading"); }} className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-emerald-700 focus:outline-none">
            <option value="">{filter.label}</option>
            {filter.options.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}
          </select>
        ))}
        <button type="submit" className="h-11 rounded-md bg-stone-900 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 focus-visible:ring-offset-2">Search</button>
      </form>

      {actionError ? <p className="mt-4 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">{actionError}</p> : null}
      {status === "loading" ? <AdminLoading label={`Loading ${config.title}`} /> : null}
      {status === "error" && error ? <AdminError message={error} onRetry={refreshList} /> : null}
      {status === "ready" && items.length === 0 ? <div className="mt-6"><AdminEmpty>No records match these filters.</AdminEmpty></div> : null}
      {status === "ready" && items.length > 0 ? (
        <div className="mt-6 overflow-hidden border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-[0.68rem] uppercase tracking-wider text-stone-500"><tr>{config.columns.map((column) => <th key={column.label} className="px-5 py-3">{column.label}</th>)}<th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-stone-200">{items.map((record) => <tr key={record.id} className="align-top">{config.columns.map((column) => <td key={column.label} className="px-5 py-4">{column.render(record)}</td>)}<td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => void editRecord(record)} className="rounded-md border border-stone-300 px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">View / edit</button><button type="button" onClick={() => setDeleteRecord(record)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">Delete</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : null}
      {pagination ? <AdminPagination pagination={pagination} onPage={(nextPage) => { setPage(nextPage); setStatus("loading"); }} /> : null}

      {formOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-stone-950/55 p-4" role="presentation" onKeyDown={(event) => { if (event.key === "Escape" && !formBusy) setFormOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="resource-form-title" className="mx-auto my-6 w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">{editingId ? "View and edit" : "Create record"}</p><h2 id="resource-form-title" className="mt-2 text-2xl font-bold">{editingId ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button type="button" autoFocus onClick={() => setFormOpen(false)} disabled={formBusy} aria-label="Close form" className="grid size-10 place-items-center rounded-md border border-stone-300 text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">×</button></div>
            {formBusy && Object.keys(formValues).length === 0 ? <p className="mt-6 text-sm text-stone-500" role="status">Loading record…</p> : (
              <form onSubmit={submitForm} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
                {config.fields.map((field) => <ResourceField key={field.name} field={field} value={formValues[field.name] ?? ""} titleDeeds={titleDeeds} onChange={(value) => setFormValues((current) => ({ ...current, [field.name]: value }))} />)}
                {formError ? <p className="sm:col-span-2 text-sm font-medium text-red-700" role="alert">{formError}</p> : null}
                <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" disabled={formBusy} onClick={() => setFormOpen(false)} className="h-11 rounded-md border border-stone-300 px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Cancel</button><button type="submit" disabled={formBusy} className="h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-60">{formBusy ? "Saving…" : editingId ? "Save changes" : "Create record"}</button></div>
              </form>
            )}
          </section>
        </div>
      ) : null}

      <ConfirmDialog open={deleteRecord !== null} title={`Delete this ${config.singular}?`} description={config.resource === "title-deeds" ? "This is only allowed after related zoning, loan/lien, and ownership records have been removed. Search logs are retained." : "This action permanently removes this development-data record."} confirmLabel="Delete record" isBusy={deleteBusy} onConfirm={() => void confirmDelete()} onCancel={() => setDeleteRecord(null)} />
    </>
  );
}

export function AdminTitleDeedsManager() {
  return <AdminResourceManager config={titleDeedConfig} />;
}

export function AdminZoningManager() {
  return <AdminResourceManager config={zoningConfig} />;
}

export function AdminLoansManager() {
  return <AdminResourceManager config={loansConfig} />;
}

export function AdminOwnershipHistoryManager() {
  return <AdminResourceManager config={ownershipConfig} />;
}

function ResourceField({ field, value, titleDeeds, onChange }: { field: FieldConfig; value: string; titleDeeds: TitleDeedSummary[]; onChange: (value: string) => void }) {
  const id = `admin-field-${field.name}`;
  const common = "mt-2 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15";
  return (
    <div className={field.type === "textarea" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="text-sm font-bold text-stone-900">{field.label}{field.required ? <span className="text-red-700"> *</span> : null}</label>
      {field.type === "textarea" ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={`${common} py-3`} /> : null}
      {field.type === "select" ? <select id={id} required={field.required} value={value} onChange={(event) => onChange(event.target.value)} className={`${common} h-11`}><option value="" disabled>Select {field.label.toLowerCase()}</option>{field.options?.map((option) => <option key={option} value={option}>{humanize(option)}</option>)}</select> : null}
      {field.type === "title-deed" ? <select id={id} required={field.required} value={value} onChange={(event) => onChange(event.target.value)} className={`${common} h-11`}><option value="">Select title deed</option>{titleDeeds.map((deed) => <option key={deed.id} value={deed.id}>{deed.titleDeedNumber} — {deed.ownerName}</option>)}</select> : null}
      {(field.type === "text" || field.type === "decimal" || field.type === "date") ? <input id={id} type={field.type === "date" ? "date" : "text"} inputMode={field.type === "decimal" ? "decimal" : undefined} required={field.required} value={value} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} className={`${common} h-11`} /> : null}
    </div>
  );
}
