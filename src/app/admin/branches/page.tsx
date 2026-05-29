"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createBranch, updateBranch, deleteBranch } from "@/lib/actions";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Filter,
  MapPin,
  Store
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
};

export default function BranchesManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createSupabaseBrowserClient();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('branches')
        .select('*')
        .order('name');
      
      if (fetchError) throw new Error(fetchError.message);
      setBranches(data || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred fetching branches.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBranches();
  }, [supabase]);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditId(branch.id);
      setName(branch.name);
      setLocation(branch.location || "");
    } else {
      setEditId(null);
      setName("");
      setLocation("");
    }
    setModalError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalLoading(true);
    try {
      if (editId) {
        await updateBranch(editId, name, location || null);
      } else {
        await createBranch(name, location || null);
      }
      setShowModal(false);
      loadBranches();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "An error occurred saving the branch.");
    }
    setModalLoading(false);
  };

  const handleDelete = async (id: string, branchName: string) => {
    if (!confirm(`Permanently remove the branch "${branchName}"? This cannot be undone and may affect assigned users and inventory.`)) return;
    try {
      await deleteBranch(id);
      loadBranches();
    } catch (e) {
      alert(e instanceof Error ? e.message : "An error occurred deleting the branch.");
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.location && b.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <h2 className="text-3xl font-bold text-apex-text tracking-tight">Branches</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">
            Manage physical store locations • {branches.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-apex-surface border border-apex-outline-variant text-apex-text pl-10 pr-4 py-2 font-apex-sans text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-apex-primary/30"
            />
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-apex-on-surface-variant" />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-apex-primary hover:bg-apex-primary/90 text-apex-bg font-apex-sans text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> New Branch
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-apex-error-container/20 border border-apex-error/30 text-apex-error p-6 rounded space-y-2 font-apex-mono mb-4">
          <h3 className="font-bold text-xs uppercase flex items-center gap-2 tracking-widest">
            <Activity size={16} /> [SYSTEM ERROR]
          </h3>
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* Main Table Panel */}
      {!error && (
        <div className="bg-apex-surface border border-apex-outline-variant rounded-xl flex flex-col relative overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-apex-surface-lowest border-b border-apex-outline-variant font-apex-sans text-xs text-apex-on-surface-variant uppercase tracking-wider font-medium">
                  <th className="py-4 px-6 w-24">Icon</th>
                  <th className="py-4 px-6">Branch Name</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Added On</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-apex-outline-variant text-apex-text">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <div className="flex justify-center">
                        <Loader2 size={32} className="animate-spin text-apex-on-surface-variant/40" />
                      </div>
                    </td>
                  </tr>
                ) : filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                      <Store size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                      <p className="font-bold text-xs uppercase tracking-widest">NO BRANCHES FOUND</p>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((b) => (
                    <tr key={b.id} className="hover:bg-apex-surface-lowest transition-colors group">
                      <td className="py-3 px-6">
                        <div className="w-10 h-10 rounded-lg bg-apex-surface-highest text-apex-on-surface-variant group-hover:text-apex-text flex items-center justify-center shrink-0 transition-colors">
                          <Store size={16} />
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <p className="font-apex-sans font-medium text-sm text-apex-text">{b.name}</p>
                      </td>
                      <td className="py-3 px-6 font-apex-sans text-sm text-apex-on-surface-variant flex items-center gap-2">
                        {b.location ? (
                          <>
                            <MapPin size={14} className="opacity-50" />
                            {b.location}
                          </>
                        ) : (
                          <span className="opacity-50 italic">Unspecified</span>
                        )}
                      </td>
                      <td className="py-3 px-6 font-apex-sans text-sm text-apex-on-surface-variant">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(b)}
                            className="text-apex-on-surface-variant/50 hover:text-apex-primary transition-colors p-2"
                            title="Edit Branch"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(b.id, b.name)}
                            className="text-apex-on-surface-variant/50 hover:text-apex-error transition-colors p-2"
                            title="Delete Branch"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

            <h2 className="text-xl font-apex-sans font-bold text-apex-text mb-6">
              {editId ? "Edit Branch" : "New Branch"}
            </h2>

            {modalError && (
              <div className="mb-4 p-3 bg-apex-error-container text-apex-error text-sm border border-apex-error-container rounded">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-apex-on-surface-variant mb-2">
                  Branch Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apex-on-surface-variant/50">
                    <Store size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-apex-surface border border-apex-outline-variant text-apex-text pl-11 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apex-primary/30 transition-all"
                    placeholder="e.g. Nairobi Downtown"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-apex-on-surface-variant mb-2">
                  Location (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-apex-on-surface-variant/50">
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-apex-surface border border-apex-outline-variant text-apex-text pl-11 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-apex-primary/30 transition-all"
                    placeholder="e.g. Moi Avenue"
                  />
                </div>
              </div>

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
                  {editId ? "Save Changes" : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
