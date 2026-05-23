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
  Filter,
  MoreVertical,
  Plus,
  HardDrive,
  Activity,
  Database
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

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = users.filter((u) => !u.is_banned).length;
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <h2 className="text-3xl font-bold text-apex-text tracking-tight">Staff Users</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">
            Manage administrative access • {users.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-apex-surface border border-apex-outline-variant text-apex-text hover:bg-apex-surface-low px-4 py-2 font-apex-sans text-sm font-medium transition-colors rounded-lg shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-apex-primary hover:bg-apex-primary/90 text-apex-bg font-apex-sans text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> New User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-apex-error-container/20 border border-apex-error/30 text-apex-error p-6 rounded space-y-2 font-apex-mono mb-4">
          <h3 className="font-bold text-xs uppercase flex items-center gap-2 tracking-widest">
            <Shield size={16} /> [SECURITY / CONFIGURATION ERROR]
          </h3>
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Table Panel */}
      {!error && (
        <div className="bg-apex-surface border border-apex-outline-variant rounded-xl flex flex-col relative overflow-hidden shadow-sm">
          
          <div className="absolute top-0 right-0 p-4 w-64 opacity-0 pointer-events-none">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-apex-surface-lowest border-b border-apex-outline-variant font-apex-sans text-xs text-apex-on-surface-variant uppercase tracking-wider font-medium">
                  <th className="py-4 px-6 w-24">Role</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Added On</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant text-apex-text">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-apex-outline-variant/35 border-t-apex-primary rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                      <Users size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                      <p className="font-bold text-xs uppercase tracking-widest">NO NODES DETECTED MATCHING QUERY</p>
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((u) => {
                    const isAdmin = u.id === ADMIN_UID;
                    const isPending = pendingBanId === u.id;
                    
                    return (
                      <tr key={u.id} className="hover:bg-apex-surface-lowest transition-colors group">
                        {/* ROLE VISUAL */}
                        <td className="py-3 px-6">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isAdmin ? "bg-apex-primary text-apex-bg" : "bg-apex-surface-highest text-apex-on-surface-variant group-hover:text-apex-text"}`}>
                            {isAdmin ? <Shield size={16} /> : <Users size={16} />}
                          </div>
                        </td>
                        
                        {/* EMAIL */}
                        <td className="py-3 px-6">
                          <p className="font-apex-sans font-medium text-sm text-apex-text">{u.email}</p>
                          <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">{isAdmin ? "Full Access" : "Standard Access"}</p>
                        </td>

                        {/* TYPE */}
                        <td className="py-3 px-6 font-apex-sans text-sm text-apex-on-surface-variant">
                          {isAdmin ? "Administrator" : "Staff"}
                        </td>

                        {/* ADDED ON */}
                        <td className="py-3 px-6 font-apex-sans text-sm text-apex-on-surface-variant">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-6 text-center">
                          {isPending ? (
                            <Loader2 size={16} className="animate-spin text-apex-on-surface-variant/40 mx-auto" />
                          ) : (
                            <span className={`inline-block px-3 py-1 rounded-full font-apex-sans text-xs font-medium transition-colors ${
                              u.is_banned
                                ? "bg-apex-error-container text-apex-error"
                                : "bg-apex-tertiary-container text-apex-tertiary"
                            }`}>
                              {u.is_banned ? "Suspended" : "Active"}
                            </span>
                          )}
                        </td>

                        {/* PROTOCOL */}
                        <td className="py-3 px-6 text-center">
                          {!isAdmin && (
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleOpenModal(u)}
                                className="text-apex-on-surface-variant/50 hover:text-apex-primary transition-colors p-2"
                                title="Configure Node"
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleToggleBan(u)}
                                disabled={isPending}
                                className={`text-apex-on-surface-variant/50 transition-colors p-2 ${u.is_banned ? "hover:text-apex-secondary" : "hover:text-apex-error"}`}
                                title={u.is_banned ? "Activate Node" : "Suspend Node"}
                              >
                                {u.is_banned ? <Power size={14} /> : <PowerOff size={14} />}
                              </button>
                              <button 
                                onClick={() => handleDelete(u.id)}
                                className="text-apex-on-surface-variant/50 hover:text-apex-error transition-colors p-2"
                                title="Terminate Node"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                          {isAdmin && (
                            <span className="text-apex-on-surface-variant/30">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Registry Footer Pagination */}
          <div className="px-6 py-4 bg-apex-surface-lowest border-t border-apex-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 font-apex-sans text-sm text-apex-on-surface-variant">
            <div className="flex items-center gap-4">
              <span>Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length}</span>
            </div>
            <div className="flex gap-1.5 text-xs text-apex-text select-none">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-apex-surface-highest bg-apex-surface-low hover:bg-apex-surface cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >&lt;</button>
              <span className="px-3 h-8 flex items-center justify-center rounded border border-apex-primary bg-apex-surface-low text-apex-primary font-bold">
                {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-apex-surface-highest bg-apex-surface-low hover:bg-apex-surface cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >&gt;</button>
            </div>
          </div>

        </div>
      )}

      {/* Telemetry Cards at Bottom */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm">
            <div className="flex justify-between items-start text-apex-on-surface-variant">
              <span className="font-apex-sans text-sm font-medium">Active Users</span>
              <div className="w-8 h-8 rounded-full bg-apex-surface-highest flex items-center justify-center">
                <Activity size={16} className="text-apex-text" />
              </div>
            </div>
            <div>
              <p className="font-apex-sans text-4xl text-apex-text font-bold tracking-tight">{activeCount}</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-1">{users.length - activeCount} suspended</p>
            </div>
          </div>

          <div className="bg-apex-surface border border-apex-outline-variant rounded-2xl p-6 flex flex-col justify-between h-36 shadow-sm">
            <div className="flex justify-between items-start text-apex-on-surface-variant">
              <span className="font-apex-sans text-sm font-medium">Total Staff</span>
              <div className="w-8 h-8 rounded-full bg-apex-surface-highest flex items-center justify-center">
                <Users size={16} className="text-apex-text" />
              </div>
            </div>
            <div>
              <p className="font-apex-sans text-4xl text-apex-text font-bold tracking-tight">{users.length}</p>
              <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-1">Registered members</p>
            </div>
          </div>

          <div 
            className="bg-apex-primary text-apex-bg rounded-2xl p-6 flex flex-col justify-between h-36 shadow-md cursor-pointer hover:bg-apex-primary/90 transition-colors" 
            onClick={() => handleOpenModal()}
          >
            <div className="flex justify-between items-start text-apex-bg/80">
              <span className="font-apex-sans text-sm font-medium">Action</span>
              <div className="w-8 h-8 rounded-full bg-apex-bg/20 flex items-center justify-center">
                <UserPlus size={16} className="text-apex-bg" />
              </div>
            </div>
            <div className="flex-grow flex items-center">
              <p className="font-apex-sans text-xl text-apex-bg font-bold">New User</p>
            </div>
          </div>

        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-apex-sans">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-apex-bg p-8 w-full max-w-md shadow-xl rounded-xl border border-apex-outline-variant text-apex-text">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-apex-on-surface-variant hover:text-apex-text transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-apex-sans font-bold text-apex-text mb-2">
              {editId ? "Edit User" : "New User"}
            </h2>
            {!editId && (
              <p className="text-sm text-apex-on-surface-variant mb-6 leading-relaxed">
                A temporary password <span className="font-bold text-apex-primary">seller</span> will be set. Users must update this on their first login.
              </p>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-apex-error-container text-apex-error text-sm border border-apex-error-container rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 mt-4">
              <div>
                <label className="block text-sm font-medium text-apex-on-surface-variant mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apex-on-surface-variant/50">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-apex-surface border border-apex-outline-variant text-apex-text pl-11 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apex-primary/30 transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              {editId && (
                <div>
                  <label className="block text-sm font-medium text-apex-on-surface-variant mb-2">
                    New Password{" "}
                    <span className="text-apex-on-surface-variant/60 font-normal">
                      (leave blank to keep current)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-apex-surface border border-apex-outline-variant text-apex-text px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apex-primary/30 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-apex-surface border border-apex-outline-variant text-apex-text text-sm font-medium rounded-lg hover:bg-apex-surface-low transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 bg-apex-primary hover:bg-apex-primary/90 text-apex-bg text-sm font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {modalLoading && <Loader2 size={14} className="animate-spin" />}
                  {editId ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
