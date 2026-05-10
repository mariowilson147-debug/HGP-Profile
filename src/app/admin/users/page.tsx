"use client";

import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/auth-actions";
import { Search, Shield, Users, Mail, Key, UserPlus, Filter, Download } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type UserData = { id: string; email?: string; role: string; created_at: string };

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user: authUser } = useAuth();
  
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
      setPassword(""); 
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
    if (confirm("Are you sure you want to completely remove this staff member?")) {
      try {
        await deleteUser(id);
        loadUsers();
      } catch (e) {
        alert(e instanceof Error ? e.message : "An error occurred deleting the user.");
      }
    }
  };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDownloadCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Email", "Role", "Created At"];
    const csvRows = [headers.join(",")];
    for (const u of users) {
      csvRows.push([
        u.id, 
        `"${u.email}"`, 
        `"${u.role}"`, 
        `"${u.created_at}"`
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mock data mapping for visual completeness matching the design
  const getMockDepartment = (role: string) => {
    if (role === 'admin') return 'Operations';
    return 'Logistics';
  };

  const getMockStatus = (id: string) => {
    return Math.random() > 0.1 ? 'ACTIVE' : 'ON LEAVE';
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12 pt-12">

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Staff</span>
            <span className="text-4xl font-display font-bold text-slate-800 mb-1">{users.length}</span>
            <span className="text-xs text-slate-500">+1 this month</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Active Roles</span>
            <span className="text-4xl font-display font-bold text-slate-800 mb-1">2</span>
            <span className="text-xs text-slate-500">Admin & Wholesale</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col justify-center items-start cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handleOpenModal()}>
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Quick Action</span>
            <div className="flex items-center gap-3 text-blue-700">
              <UserPlus size={24} />
              <span className="font-display font-bold text-lg leading-tight">Add Staff<br/>Member</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-xl space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Shield size={16} /> Configuration Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Directory Section */}
        {!error && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Personnel Directory</h2>
              <div className="flex items-center gap-3">
                <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role / Designation</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">No staff members found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const status = getMockStatus(u.id);
                      return (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                {u.role === 'admin' ? <Shield size={18} /> : <Users size={18} />}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800 block">{u.email?.split('@')[0]}</span>
                                <span className="text-xs text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 px-6">
                            <span className="font-semibold text-slate-700">
                              {u.role === 'admin' ? 'Catalog Administrator' : 'Wholesale Client'}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-sm text-blue-600">
                            {getMockDepartment(u.role)}
                          </td>
                          <td className="p-4 px-6">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-4 px-6 text-right">
                            {u.role !== 'admin' && (
                              <button 
                                onClick={() => handleDelete(u.id)} 
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                              >
                                <span className="text-red-500">-</span> Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
              <span>Showing {filteredUsers.length} of {users.length} results</span>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">&lt;</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-800 bg-slate-800 text-white font-medium">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50">&gt;</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white p-8 w-full max-w-md shadow-xl rounded-3xl border border-slate-100">
            <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">{editId ? "Edit Staff Member" : "Add Staff Member"}</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={16} />
                  </div>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="member@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password {editId && <span className="text-slate-400 normal-case tracking-normal">(leave blank to keep)</span>}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Key size={16} />
                  </div>
                  <input type="password" required={!editId} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all rounded-xl">{editId ? "Save Changes" : "Create Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
