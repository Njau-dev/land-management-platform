"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

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
} from "@/components/admin/admin-ui";
import {
  getAdminUserRequest,
  listAdminUsersRequest,
  updateAdminUserStatusRequest,
} from "@/features/admin/admin.api";
import {
  getAdminErrorMessage,
  isAdminForbidden,
} from "@/features/admin/admin.errors";
import type {
  AdminUser,
  AdminUserDetail,
  Pagination,
} from "@/features/admin/admin.types";
import { useAuth } from "@/features/auth/use-auth";

export function AdminUsers() {
  const { refreshUser } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [role, setRole] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AdminUser | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleForbidden = useCallback(
    async (requestError: unknown) => {
      if (isAdminForbidden(requestError)) await refreshUser();
    },
    [refreshUser],
  );

  useEffect(() => {
    let cancelled = false;
    void listAdminUsersRequest({ page, limit: 20, search, role, status: userStatus })
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
  }, [handleForbidden, page, reloadKey, role, search, userStatus]);

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

  async function viewUser(user: AdminUser) {
    setDetailBusy(true);
    setActionError(null);
    try {
      setDetail(await getAdminUserRequest(user.id));
    } catch (detailError) {
      setActionError(getAdminErrorMessage(detailError));
      await handleForbidden(detailError);
    } finally {
      setDetailBusy(false);
    }
  }

  async function confirmStatusChange() {
    if (!pendingStatus || mutationBusy) return;
    const nextStatus = pendingStatus.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setMutationBusy(true);
    setActionError(null);
    try {
      await updateAdminUserStatusRequest(pendingStatus.id, nextStatus);
      setPendingStatus(null);
      setDetail(null);
      refreshList();
    } catch (mutationError) {
      setActionError(getAdminErrorMessage(mutationError));
      setPendingStatus(null);
      await handleForbidden(mutationError);
    } finally {
      setMutationBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader eyebrow="Account oversight" title="Users" description="Search customer accounts, inspect current paid access, and suspend or reactivate functionality without deleting history." />

      <form onSubmit={submitSearch} className="mt-8 grid gap-3 border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_10rem_10rem_auto]" aria-label="Filter users">
        <label className="sr-only" htmlFor="user-search">Search users</label>
        <input id="user-search" value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Search name or email" className="h-11 min-w-0 rounded-md border border-stone-300 px-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15" />
        <label className="sr-only" htmlFor="user-role">Role</label>
        <select id="user-role" value={role} onChange={(event) => { setRole(event.target.value); setPage(1); setStatus("loading"); }} className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-emerald-700 focus:outline-none"><option value="">All roles</option><option value="USER">User</option><option value="ADMIN">Admin</option></select>
        <label className="sr-only" htmlFor="user-status">Status</label>
        <select id="user-status" value={userStatus} onChange={(event) => { setUserStatus(event.target.value); setPage(1); setStatus("loading"); }} className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm focus:border-emerald-700 focus:outline-none"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option></select>
        <button type="submit" className="h-11 rounded-md bg-emerald-950 px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">Search</button>
      </form>

      {actionError ? <p className="mt-4 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">{actionError}</p> : null}
      {status === "loading" ? <AdminLoading label="Loading users" /> : null}
      {status === "error" && error ? <AdminError message={error} onRetry={refreshList} /> : null}
      {status === "ready" && items.length === 0 ? <div className="mt-6"><AdminEmpty>No users match these filters.</AdminEmpty></div> : null}
      {status === "ready" && items.length > 0 ? (
        <div className="mt-6 overflow-hidden border border-stone-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-[0.68rem] uppercase tracking-wider text-stone-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Current access</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-5 py-4"><p className="font-bold text-stone-950">{user.name}</p><p className="mt-1 text-xs text-stone-500">{user.email}</p></td>
                    <td className="px-5 py-4"><AdminBadge value={user.role} /></td>
                    <td className="px-5 py-4"><AdminBadge value={user.status} /></td>
                    <td className="px-5 py-4">{user.currentSubscription ? <><p className="font-semibold">{user.currentSubscription.plan.name}</p><p className="mt-1 text-xs text-stone-500">Through {formatAdminDate(user.currentSubscription.accessEndsAt)}</p></> : <span className="text-stone-500">No active plan</span>}</td>
                    <td className="px-5 py-4 text-stone-600">{formatAdminDate(user.createdAt)}</td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" disabled={detailBusy} onClick={() => void viewUser(user)} className="rounded-md border border-stone-300 px-3 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">View</button>{user.role === "USER" ? <button type="button" onClick={() => setPendingStatus(user)} className={`rounded-md px-3 py-2 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${user.status === "ACTIVE" ? "bg-red-700 focus-visible:ring-red-600" : "bg-emerald-800 focus-visible:ring-emerald-700"}`}>{user.status === "ACTIVE" ? "Suspend" : "Reactivate"}</button> : null}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {pagination ? <AdminPagination pagination={pagination} onPage={(nextPage) => { setPage(nextPage); setStatus("loading"); }} /> : null}

      {detail ? (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-stone-950/55 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="user-detail-title" className="my-8 w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">User detail</p><h2 id="user-detail-title" className="mt-2 text-2xl font-bold">{detail.name}</h2><p className="mt-1 text-sm text-stone-500">{detail.email}</p></div><button type="button" autoFocus onClick={() => setDetail(null)} aria-label="Close user detail" className="grid size-10 place-items-center rounded-md border border-stone-300 text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">×</button></div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3"><Detail label="Role"><AdminBadge value={detail.role} /></Detail><Detail label="Status"><AdminBadge value={detail.status} /></Detail><Detail label="Joined">{formatAdminDate(detail.createdAt)}</Detail></dl>
            <div className="mt-6 border border-stone-200 bg-stone-50 p-4"><h3 className="text-sm font-bold">Current subscription</h3>{detail.currentSubscription ? <p className="mt-2 text-sm text-stone-700">{detail.currentSubscription.plan.name} · paid through {formatAdminDate(detail.currentSubscription.accessEndsAt)}</p> : <p className="mt-2 text-sm text-stone-500">No active subscription.</p>}</div>
            <div className="mt-6"><h3 className="text-sm font-bold">Recent payments</h3>{detail.payments.length ? <ul className="mt-3 divide-y divide-stone-200 border border-stone-200">{detail.payments.map((payment) => <li key={payment.id} className="flex items-center justify-between gap-4 p-3 text-sm"><span>{payment.plan.name}<span className="ml-2 text-stone-500">{formatAdminDate(payment.createdAt)}</span></span><span className="font-bold">{formatAdminKes(payment.amountKes)}</span></li>)}</ul> : <p className="mt-2 text-sm text-stone-500">No recent payments.</p>}</div>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus?.status === "ACTIVE" ? "Suspend this user?" : "Reactivate this user?"}
        description={pendingStatus?.status === "ACTIVE" ? "The user will immediately lose access to authenticated functionality. Their financial and search history will remain intact." : "The user will regain authenticated access. Subscription requirements will continue to apply normally."}
        confirmLabel={pendingStatus?.status === "ACTIVE" ? "Suspend user" : "Reactivate user"}
        isBusy={mutationBusy}
        onConfirm={() => void confirmStatusChange()}
        onCancel={() => setPendingStatus(null)}
      />
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-[0.68rem] font-bold uppercase tracking-wider text-stone-500">{label}</dt><dd className="mt-2 text-sm text-stone-800">{children}</dd></div>;
}
