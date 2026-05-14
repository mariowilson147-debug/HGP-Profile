"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserBan,
  type UserData,
} from "@/lib/auth-actions";
import {
  Search,
  Shield,
  Users,
  Mail,
  UserPlus,
  Download,
  Power,
  PowerOff,
  Trash2,
  Pencil,
  X,
  Loader2,
} from "lucide-react";

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // Optimistic ban toggle
  const [pendingBanId, setPendingBanId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred fetching users.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ── Open modal ─────────────────────────────────────────────────────────────
  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditId(user.id);
      setEmail(user.email);
      setEditPassword("");
    } else {
      setEditId(null);
      setEmail("");
      setEditPassword("");
    }
    setModalError("");
    setShowModal(true);
  };

  // ── Save (create / edit) ───────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalLoading(true);
    try {
      if (editId) {
        await updateUser(editId, email, editPassword || undefined);
      } else {
        // New staff are always created with default password "seller"
        await createUser(email);
      }
      setShowModal(false);
      loadUsers();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "An error occurred.");
    }
    setModalLoading(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Permanently remove this staff member? This cannot be undone.")) return;
    try {
      await deleteUser(id);
      loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "An error occurred deleting the user.");
    }
  };

  // ── Activate / Suspend ─────────────────────────────────────────────────────
  const handleToggleBan = (user: UserData) => {
    const action = user.is_banned ? "activate" : "suspend";
    if (!confirm(`Are you sure you want to ${action} ${user.email}?`)) return;

    // Optimistic update
    setPendingBanId(user.id);
    const newBan = !user.is_banned;

    startTransition(() => {
      toggleUserBan(user.id, newBan)
        .then(() => {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, is_banned: newBan } : u))
          );
        })
        .catch((e) => {
          alert(e instanceof Error ? e.message : "Toggle failed.");
          loadUsers(); // revert by reloading
        })
        .finally(() => setPendingBanId(null));
    });
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Email", "Role", "Status", "Created At"];
    const csvRows = [headers.join(",")];
    for (const u of users) {
      csvRows.push(
        [u.id, `"${u.email}"`, `"${u.role}"`, u.is_banned ? "SUSPENDED" : "ACTIVE", `"${u.created_at}"`].join(",")
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = users.filter((u) => !u.is_banned).length;
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12 pt-12">
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Staff</span>
            <span className="text-4xl font-display font-bold text-slate-800 mb-1">{users.length}</span>
            <span className="text-xs text-slate-500">All registered accounts</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Staff</span>
            <span className="text-4xl font-display font-bold text-emerald-600 mb-1">{activeCount}</span>
            <span className="text-xs text-slate-500">Currently able to log in</span>
          </div>
          <div
            className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col justify-center items-start cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => handleOpenModal()}
          >
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Quick Action</span>
            <div className="flex items-center gap-3 text-blue-700">
              <UserPlus size={24} />
              <span className="font-display font-bold text-lg leading-tight">
                Add Staff<br />Member
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-xl space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Shield size={16} /> Configuration Error
            </h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Search bar */}
        {!error && (
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all"
            />
          </div>
        )}

        {/* Directory Table */}
        {!error && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Personnel Directory</h2>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdmin = u.id === ADMIN_UID;
                      const isPending = pendingBanId === u.id;
                      return (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          {/* Staff Member */}
                          <td className="p-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isAdmin ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                              }`}>
                                {isAdmin ? <Shield size={18} /> : <Users size={18} />}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 block">{u.email.split("@")[0]}</span>
                                <span className="text-xs text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="p-4 px-6">
                            <span className="font-medium text-slate-700">
                              {isAdmin ? "Catalog Administrator" : "Wholesale Staff"}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="p-4 px-6 text-sm text-slate-500">
                            {new Date(u.created_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </td>

                          {/* Status */}
                          <td className="p-4 px-6">
                            {isPending ? (
                              <Loader2 size={16} className="animate-spin text-slate-400" />
                            ) : (
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider ${
                                u.is_banned
                                  ? "bg-red-100 text-red-600"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {u.is_banned ? "SUSPENDED" : "ACTIVE"}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 px-6">
                            <div className="flex items-center justify-end gap-3">
                              {!isAdmin && (
                                <>
                                  {/* Activate / Suspend */}
                                  <button
                                    onClick={() => handleToggleBan(u)}
                                    disabled={isPending}
                                    title={u.is_banned ? "Activate account" : "Suspend account"}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                                      u.is_banned
                                        ? "text-emerald-600 hover:text-emerald-700"
                                        : "text-amber-600 hover:text-amber-700"
                                    }`}
                                  >
                                    {u.is_banned ? <Power size={14} /> : <PowerOff size={14} />}
                                    {u.is_banned ? "Activate" : "Suspend"}
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => handleOpenModal(u)}
                                    title="Edit"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                                  >
                                    <Pencil size={14} /> Edit
                                  </button>

                                  {/* Remove */}
                                  <button
                                    onClick={() => handleDelete(u.id)}
                                    title="Remove"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 size={14} /> Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-500">
              Showing {filteredUsers.length} of {users.length} staff members
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white p-8 w-full max-w-md shadow-xl rounded-3xl border border-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">
              {editId ? "Edit Staff Member" : "Add Staff Member"}
            </h2>
            {!editId && (
              <p className="text-sm text-slate-500 mb-6">
                A temporary password <span className="font-bold text-slate-700">seller</span> will be set. The staff member must change it on first login.
              </p>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 mt-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="member@example.com"
                  />
                </div>
              </div>

              {/* Password — only shown when editing */}
              {editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    New Password{" "}
                    <span className="text-slate-400 normal-case tracking-normal font-normal">
                      (leave blank to keep current)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {modalLoading && <Loader2 size={15} className="animate-spin" />}
                  {editId ? "Save Changes" : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
