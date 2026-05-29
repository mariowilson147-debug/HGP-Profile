"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2, ArrowDownToLine, ClipboardList, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

type Transfer = {
  id: string;
  from_branch_id: string;
  status: string;
  created_at: string;
  branches: { name: string } | null;
  transfer_items: {
    quantity: number;
    products: { name: string; category: string } | null;
  }[];
};

export default function SellerActions() {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadTransfers() {
      if (!user?.branch_id) {
        setLoading(false);
        return;
      }

      // Fetch pending incoming transfers
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          id,
          status,
          created_at,
          from_branch_id,
          branches!transfers_from_branch_id_fkey(name),
          transfer_items(
            quantity,
            products(name, category)
          )
        `)
        .eq('to_branch_id', user.branch_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (mounted && data) {
        setTransfers(data as unknown as Transfer[]);
        setLoading(false);
      }
    }

    loadTransfers();
    return () => { mounted = false; };
  }, [user, supabase]);

  const handleTransfer = async (transferId: string, action: 'accepted' | 'declined') => {
    setProcessingId(transferId);
    try {
      // Update transfer status
      const { error } = await supabase
        .from('transfers')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', transferId);
        
      if (error) throw error;

      if (action === 'accepted') {
        // Find transfer items
        const transfer = transfers.find(t => t.id === transferId);
        if (transfer && user?.branch_id) {
          // Process inventory update via RPC or client logic
          // Note: Full system would deduct from source and add to destination.
          // Since it's incoming, we just need to increment destination inventory.
          for (const item of transfer.transfer_items) {
            // Placeholder: Call an RPC 'increment_inventory' or similar
            // In MVP, we just update the transfer status.
            console.log(`Need to add ${item.quantity} to ${item.products?.name}`);
          }
        }
      }

      // Remove from list
      setTransfers(prev => prev.filter(t => t.id !== transferId));
      
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action} transfer.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/seller" className="hover:opacity-80 transition-opacity">
          <h1 className="text-3xl font-display font-bold text-slate-900">Branch Actions</h1>
        </Link>
        <p className="text-slate-500 mt-2">Manage incoming stock transfers and perform physical stock takes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Incoming Transfers Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <ArrowDownToLine size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Incoming Transfers</h2>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : transfers.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 border-dashed text-center">
              <ArrowDownToLine className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="font-medium text-slate-900">No pending transfers</p>
              <p className="text-sm text-slate-500 mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            transfers.map(transfer => {
              const isProcessing = processingId === transfer.id;
              
              return (
                <div key={transfer.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Transfer from {transfer.branches?.name || 'Main Warehouse'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          ID: {transfer.id.split('-')[0].toUpperCase()} • {new Date(transfer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                        Pending
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <ul className="space-y-3 mb-6">
                      {transfer.transfer_items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 font-medium">
                            {item.products?.name}
                          </span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            +{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-3">
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleTransfer(transfer.id, 'accepted')}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Accept Transfer
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleTransfer(transfer.id, 'declined')}
                        className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-600 border border-slate-200 font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stock Take Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Stock Take</h2>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={32} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900">Start Physical Audit</h3>
              <p className="text-sm text-slate-500 mt-2">
                Perform a physical count of all inventory currently at your branch and report variances to the manager.
              </p>
            </div>
            
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
              <ClipboardList size={20} />
              Begin Stock Take
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
