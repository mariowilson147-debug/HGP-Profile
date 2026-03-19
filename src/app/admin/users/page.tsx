"use client";

import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/auth-actions";
import { Plus, Edit, Trash2, Shield, Users } from "lucide-react";

type UserData = { id: string; email?: string; role: string; created_at: string };

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleOpenModal = (user?: UserData) => {
    if (user) {
      setEditId(user.id);
      setEmail(user.email || "");
      setPassword(""); // don't load password implicitly
    } else {
      setEditId(null);
      setEmail("");
      setPassword("");
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateUser(editId, email, password || undefined);
      } else {
        if (!password) throw new Error("Password is required for new users.");
        await createUser(email, password);
      }
      setShowModal(false);
      loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "An error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to completely delete this account?")) {
      try {
        await deleteUser(id);
        loadUsers();
      } catch (e) {
        alert(e instanceof Error ? e.message : "An error occurred deleting the user.");
      }
    }
  };

  return (
    <div className="w-full bg-[#0a0a0a] min-h-[80vh] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-serif text-[#fefefe] mb-2">User Management</h1>
            <p className="text-[#888] text-sm">Provision access strictly for wholesale clients. Only your account receives Administrator privileges.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-[#0f0f0f] px-6 py-3 rounded-sm text-xs font-medium uppercase tracking-[0.2em] hover:from-[#d4af37] hover:to-[#ebd483] transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/10 border border-red-900/30 text-red-500 p-6 rounded-sm mb-8 space-y-2">
            <h3 className="font-medium text-[11px] tracking-widest uppercase text-red-400">Configuration Required</h3>
            <p className="text-sm font-light leading-relaxed">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-t-2 border-l-2 border-[#d4af37] rounded-full animate-spin"></div>
          </div>
        ) : (!error && (
          <div className="bg-[#0f0f0f] border border-[#222] rounded-sm overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#222] bg-[#111]">
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Email Address</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Access Level</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em]">Created Date</th>
                  <th className="p-5 text-[10px] font-medium text-[#888] uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-[#222] hover:bg-[#1a1a1a]/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        {u.role === 'admin' ? <Shield size={16} className="text-[#d4af37]" /> : <Users size={16} className="text-[#888]" />}
                        <span className="font-medium text-[#e0e0e0] text-sm tracking-wide">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-5 text-xs">
                      <span className={`px-3 py-1.5 rounded-sm border text-[10px] uppercase tracking-widest font-medium ${u.role === 'admin' ? 'border-[#d4af37]/30 text-[#d4af37] bg-[#d4af37]/10' : 'border-[#222] text-[#888] bg-[#1a1a1a]'}`}>
                        {u.role === 'authenticated' ? 'Wholesale' : u.role}
                      </span>
                    </td>
                    <td className="p-5 text-sm text-[#888]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-5 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleOpenModal(u)} className="p-2 text-[#888] hover:text-[#d4af37] transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(u.id)} className="p-2 text-[#888] hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-[#0f0f0f] border border-[#333] p-8 w-full max-w-md shadow-2xl rounded-sm">
            <h2 className="text-2xl font-serif text-[#fefefe] mb-8">{editId ? "Edit Wholesale Credentials" : "Create Wholesale Client"}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">Password {editId && <span className="text-[#555] lowercase tracking-normal">(leave blank to keep current)</span>}</label>
                <input type="password" required={!editId} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-3.5 rounded-sm focus:outline-none focus:border-[#d4af37] font-light" />
              </div>
              <div className="flex gap-4 pt-6 border-t border-[#222]">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-[#111] border border-[#333] text-[#888] text-[11px] uppercase tracking-[0.2em] font-medium hover:text-[#e0e0e0] transition-colors rounded-sm">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-[#b39129] to-[#d4af37] text-black text-[11px] uppercase tracking-[0.2em] font-medium hover:from-[#d4af37] hover:to-[#ebd483] shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all rounded-sm">{editId ? "Save Changes" : "Create Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
