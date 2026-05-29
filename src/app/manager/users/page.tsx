"use client";

import { useState, useEffect } from "react";
import { useManagerBranch } from "@/components/ManagerBranchProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, Users, Plus, Shield, User, X } from "lucide-react";
import { createStaffUser } from "@/lib/manager-auth-actions";
import Link from "next/link";
import SelectDropdown from "@/components/ui/SelectDropdown";

type UserProfile = {
  id: string;
  nickname: string;
  role: string;
  branch_id: string;
};

export default function ManagerUsersPage() {
  const { selectedBranchId, availableBranches } = useManagerBranch();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("seller");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const branchName = availableBranches.find(b => b.id === selectedBranchId)?.name || "Selected Branch";

  useEffect(() => {
    async function fetchBranchUsers() {
      if (!selectedBranchId) return;
      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('id, nickname, role, branch_id')
        .eq('branch_id', selectedBranchId);
      
      if (data) setUsers(data);
      setLoading(false);
    }
    fetchBranchUsers();
  }, [selectedBranchId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    setError("");
    setIsSubmitting(true);

    try {
      await createStaffUser(email, role, selectedBranchId, nickname);
      setShowModal(false);
      setEmail("");
      setNickname("");
      setRole("seller");
      
      // Reload users
      const { data } = await supabase
        .from('user_profiles')
        .select('id, nickname, role, branch_id')
        .eq('branch_id', selectedBranchId);
      if (data) setUsers(data);

    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedBranchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Branch Selected</h2>
        <p className="text-slate-500">Please select a branch from the dashboard first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/manager" className="hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-display font-bold text-slate-900">Staff Management</h1>
          </Link>
          <p className="text-slate-500 mt-2">Manage sellers and wholesale buyers for <span className="font-semibold">{branchName}</span>.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
        >
          <Plus size={18} />
          Add New Staff
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex justify-center items-center">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <Users className="text-slate-500" size={20} />
            <h2 className="font-bold text-slate-900">Assigned Staff ({users.length})</h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Role</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 uppercase">
                          {u.nickname ? u.nickname.charAt(0) : 'U'}
                        </div>
                        <span className="font-medium text-slate-900">{u.nickname || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.role === 'seller' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {u.role === 'seller' ? <User size={12} /> : <Shield size={12} />}
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={3} className="p-8 text-center text-slate-500">No staff found for this branch.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Add New Staff</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="staff@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nickname / Name</label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <SelectDropdown
                  value={role}
                  onChange={setRole}
                  options={[
                    { label: "Seller", value: "seller" },
                    { label: "Wholesale Buyer", value: "wholesale" }
                  ]}
                />
              </div>

              <div className="pt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                <p><strong>Note:</strong> This user will automatically be assigned to the current branch ({branchName}). Their default password will be <code className="bg-white px-1 py-0.5 rounded border">seller</code>.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-white font-medium bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
