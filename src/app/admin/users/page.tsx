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

  const activeCount = users.filter((u) => !u.is_banned).length;
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-apex-primary"></div>
            <h2 className="font-apex-sans text-3xl font-black text-apex-text uppercase tracking-tight">REGISTRY: NODES</h2>
          </div>
          <p className="font-apex-mono text-[10px] text-apex-secondary mt-2 tracking-widest uppercase">
            ARCHIVE_QUERY: [FILTER=CATALOGUE_ALL] | RECORDS_TOTAL: {users.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-[#131b2e] border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded">
            <Filter size={14} /> Refine View
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-apex-primary hover:brightness-110 text-[#0b1326] font-apex-sans font-bold text-[11px] tracking-widest uppercase px-5 py-2.5 rounded shadow-[0_0_15px_rgba(192,193,255,0.3)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Initialize New Node
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
        <div className="bg-[#131b2e] border border-apex-outline-variant/20 rounded flex flex-col relative overflow-hidden">
          
          <div className="absolute top-0 right-0 p-4 w-64 opacity-0 pointer-events-none">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#171f33]/80 border-b border-apex-outline-variant/20 font-apex-sans font-bold text-[10px] text-apex-on-surface-variant/80 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold w-24">NODE_VISUAL</th>
                  <th className="py-4 px-6 font-bold">IDENTIFIER_STRING</th>
                  <th className="py-4 px-6 font-bold">CORE_PREFIX_SLUG</th>
                  <th className="py-4 px-6 font-bold">CLEARANCE_DATE</th>
                  <th className="py-4 px-6 font-bold text-center">STATUS</th>
                  <th className="py-4 px-6 font-bold text-center">PROTOCOL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant/10 text-apex-text">
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
                  filteredUsers.map((u) => {
                    const isAdmin = u.id === ADMIN_UID;
                    const isPending = pendingBanId === u.id;
                    
                    return (
                      <tr key={u.id} className="hover:bg-[#171f33]/40 transition-colors group">
                        {/* NODE_VISUAL */}
                        <td className="py-3 px-6">
                          <div className={`w-12 h-10 bg-[#060e20] border flex items-center justify-center shrink-0 group-hover:border-apex-primary/50 transition-colors ${isAdmin ? "border-apex-primary/30 text-apex-primary shadow-[0_0_10px_rgba(192,193,255,0.1)]" : "border-apex-outline-variant/30 text-apex-on-surface-variant group-hover:text-apex-primary/80"}`}>
                            {isAdmin ? <Shield size={16} /> : <Users size={16} />}
                          </div>
                        </td>
                        
                        {/* IDENTIFIER_STRING */}
                        <td className="py-3 px-6">
                          <p className="font-apex-sans font-bold text-sm tracking-wide text-apex-text">{u.email}</p>
                          <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest uppercase mt-0.5">ACCESS_LEVEL_{isAdmin ? "5" : "3"}</p>
                        </td>

                        {/* CORE_PREFIX_SLUG */}
                        <td className="py-3 px-6 font-apex-mono text-xs text-apex-on-surface-variant tracking-wider uppercase">
                          {isAdmin ? "CATALOG_ADMIN" : "WHOLESALE_STAFF"}
                        </td>

                        {/* CLEARANCE_DATE */}
                        <td className="py-3 px-6 font-apex-mono text-xs text-apex-on-surface-variant tracking-wider">
                          {new Date(u.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-6 text-center">
                          {isPending ? (
                            <Loader2 size={16} className="animate-spin text-apex-on-surface-variant/40 mx-auto" />
                          ) : (
                            <span className={`inline-block px-2 py-0.5 border font-apex-mono text-[9px] font-bold tracking-widest uppercase ${
                              u.is_banned
                                ? "bg-[#060e20] border-apex-outline-variant/30 text-apex-on-surface-variant"
                                : "border-apex-primary/30 bg-apex-primary/10 text-apex-primary shadow-[0_0_10px_rgba(192,193,255,0.1)]"
                            }`}>
                              {u.is_banned ? "IDLE" : "ACTIVE"}
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
          <div className="px-6 py-4 bg-[#0b1326] border-t border-apex-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-apex-mono text-[10px] text-apex-on-surface-variant/70 tracking-widest uppercase">
            <div className="flex items-center gap-4">
              <span>SHOWING ENTRY 001-{(filteredUsers.length < 10 ? filteredUsers.length : '010')} OF {users.length}</span>
              <div className="w-24 h-1 bg-[#171f33] rounded-full overflow-hidden flex">
                <div className="w-1/4 h-full bg-apex-primary"></div>
              </div>
            </div>
            <div className="flex gap-1.5 text-xs text-apex-text select-none">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-apex-primary bg-[#131b2e] text-apex-primary font-bold">01</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors">02</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors">03</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border-[#2d3449] bg-[#131b2e] hover:bg-[#171f33] cursor-pointer transition-colors">&gt;</button>
            </div>
          </div>

        </div>
      )}

      {/* Telemetry Cards at Bottom */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          <div className="bg-[#131b2e] border-l-2 border-l-apex-primary border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative">
            <div className="flex justify-between items-start text-apex-on-surface-variant">
              <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">ACTIVE NODES</span>
              <Activity size={16} className="text-apex-primary" />
            </div>
            <div>
              <p className="font-apex-sans text-3xl text-apex-text leading-none font-black tracking-tight">{activeCount}</p>
              <p className="font-apex-mono text-[9px] text-apex-primary mt-1 tracking-widest uppercase font-bold">CLEARANCE_VERIFIED</p>
            </div>
            <div className="absolute bottom-4 left-5 right-5 flex justify-between font-apex-mono text-[9px] text-apex-on-surface-variant/70 uppercase tracking-widest">
              <span>SUSPENDED: {users.length - activeCount}</span>
              <span className="text-apex-primary">NETWORK: SECURE</span>
            </div>
          </div>

          <div className="bg-[#131b2e] border-l-2 border-l-apex-text border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative">
            <div className="flex justify-between items-start text-apex-on-surface-variant">
              <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">TOTAL PERSONNEL</span>
              <Users size={16} className="text-apex-text" />
            </div>
            <div>
              <p className="font-apex-sans text-3xl text-apex-text leading-none font-black tracking-tight">{users.length}</p>
              <p className="font-apex-mono text-[9px] text-apex-on-surface-variant mt-1 tracking-widest uppercase font-bold">REGISTERED_ENTITIES</p>
            </div>
            <div className="absolute bottom-4 left-5 right-5 flex justify-between font-apex-mono text-[9px] text-apex-on-surface-variant/70 uppercase tracking-widest">
              <span>AUTH: REQUIRED</span>
              <span className="text-apex-text">SYNC: ACTIVE</span>
            </div>
          </div>

          <div className="bg-[#131b2e] border-l-2 border-l-apex-secondary border-t border-r border-b border-apex-outline-variant/20 p-5 flex flex-col justify-between h-32 relative group cursor-pointer hover:border-apex-secondary/50 transition-colors" onClick={() => handleOpenModal()}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-apex-secondary/50"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-apex-secondary/50"></div>
            <div className="flex justify-between items-start text-apex-secondary">
              <span className="font-apex-sans text-xs tracking-widest uppercase font-bold">SYSTEM COMMAND</span>
              <UserPlus size={16} />
            </div>
            <div className="flex-grow flex items-center">
              <p className="font-apex-sans text-xl text-apex-secondary leading-tight font-black tracking-tight uppercase group-hover:scale-105 transition-transform">Initialize<br/>Staff Node</p>
            </div>
          </div>

        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-apex-sans">
          <div
            className="absolute inset-0 bg-[#0b1326]/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-[#0b1326] p-8 w-full max-w-md shadow-[0_0_30px_rgba(192,193,255,0.1)] rounded border border-apex-primary/30 text-apex-text apex-scanline-effect">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-apex-on-surface-variant hover:text-apex-text transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-apex-sans font-black text-apex-text uppercase mb-2">
              {editId ? "CONFIGURE STAFF NODE" : "INITIALIZE STAFF NODE"}
            </h2>
            {!editId && (
              <p className="text-[10px] text-apex-on-surface-variant/70 font-apex-mono mb-6 leading-relaxed uppercase">
                A TEMPORARY SESSION TOKEN <span className="font-bold text-apex-primary">seller</span> WILL BE SET. THE CORRESPONDING STAFF NODE MUST UPDATE IT ON INITIAL HANDSHAKE.
              </p>
            )}

            {modalError && (
              <div className="mb-4 p-3 bg-apex-error/10 text-apex-error text-xs font-apex-mono border border-apex-error/30 rounded uppercase">
                [ERROR]: {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5 mt-4">
              <div>
                <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">
                  IDENTIFIER_STRING [EMAIL]
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apex-on-surface-variant/40">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#131b2e] border border-apex-outline-variant/30 text-apex-text pl-11 pr-4 py-3 rounded text-xs focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all font-apex-mono"
                    placeholder="sys.op@apex.com"
                  />
                </div>
              </div>

              {editId && (
                <div>
                  <label className="block text-[10px] font-bold text-apex-on-surface-variant/60 uppercase tracking-widest font-apex-mono mb-2">
                    NEW SECURITY PROTOCOL{" "}
                    <span className="text-apex-on-surface-variant/45 normal-case font-normal">
                      (leave blank to keep current)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-[#131b2e] border border-apex-outline-variant/30 text-apex-text px-4 py-3 rounded text-xs focus:outline-none focus:border-apex-primary/50 focus:ring-1 focus:ring-apex-primary/30 transition-all font-apex-mono"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-[#131b2e] hover:bg-[#171f33] border border-apex-outline-variant/30 text-apex-text text-xs font-apex-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 bg-apex-primary hover:brightness-110 text-[#0b1326] text-xs font-apex-sans font-bold uppercase tracking-wider rounded disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(192,193,255,0.2)]"
                >
                  {modalLoading && <Loader2 size={14} className="animate-spin" />}
                  {editId ? "COMMIT CHANGES" : "AUTHORIZE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
