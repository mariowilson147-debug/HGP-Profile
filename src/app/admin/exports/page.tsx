"use client";

import { useState, useEffect, useRef } from "react";
import { getProducts } from "@/lib/actions";
import { 
  FileSpreadsheet, 
  Download, 
  FileText, 
  RefreshCw, 
  Share2, 
  Filter, 
  Lock, 
  Rocket, 
  RefreshCcw,
  Sparkles,
  Terminal as TerminalIcon,
  Plus,
  MoreVertical,
  Archive,
  Database
} from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";

const getBase64ImageFromUrl = async (imageUrl: string) => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader  = new FileReader();
    reader.addEventListener("load", function () {
      resolve(reader.result);
    }, false);
    reader.onerror = () => {
      return reject(new Error("Failed to load image"));
    };
    reader.readAsDataURL(blob);
  });
};

interface ExportLog {
  id: string;
  target: string;
  format: string;
  size: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  date: string;
}

export default function ExportsHub() {
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "pdf" | "link">("excel");
  const [exporting, setExporting] = useState(false);
  const { settings } = useSettings();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [historyLogs, setHistoryLogs] = useState<ExportLog[]>([
    { id: "EXP-8921", target: "All Categories Export", format: ".XLSX", size: "1.2 MB", status: "COMPLETED", date: new Date().toLocaleDateString("en-GB") },
    { id: "EXP-8920", target: "Lighting & Electronics", format: ".PDF", size: "3.4 MB", status: "COMPLETED", date: new Date(Date.now() - 86400000).toLocaleDateString("en-GB") },
    { id: "EXP-8919", target: "Client Shared Link", format: "LINK", size: "--", status: "COMPLETED", date: new Date(Date.now() - 86400000 * 2).toLocaleDateString("en-GB") },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(historyLogs.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleLogs = historyLogs.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getProducts();
      const uniqueCats = Array.from(new Set(data.map(p => p.category)));
      setCategories(uniqueCats);
    };
    loadCategories();
  }, []);

  const fetchCatalogData = async () => {
    return await getProducts();
  };

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleExcelExport = async () => {
    setExporting(true);
    try {
      const allProducts = await fetchCatalogData();
      const products = selectedCategories.length > 0 
        ? allProducts.filter(p => selectedCategories.includes(p.category))
        : [...allProducts];

      products.sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
        
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Catalog');

      sheet.columns = [
        { header: 'Image', key: 'image', width: 15 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Product Name', key: 'name', width: 40 },
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Cost Price', key: 'cost', width: 15 },
        { header: 'Wholesale Price', key: 'wholesale', width: 15 },
        { header: 'Retail Price', key: 'retail', width: 15 },
      ];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const rowIndex = i + 2; 
        const row = sheet.addRow({
          sku: `${p.category.substring(0,3).toUpperCase()}-${p.id.substring(0, 8).toUpperCase()}`,
          name: p.name,
          category: p.category,
          cost: p.buying_price || 0,
          wholesale: p.wholesale_price || 0,
          retail: p.retail_price || 0
        });
        row.height = 60; 

        if (p.image_url) {
          try {
            const res = await fetch(p.image_url);
            const buffer = await res.arrayBuffer();
            const extension = p.image_url.split('.').pop()?.toLowerCase();
            const imageType: 'png' | 'jpeg' = extension === 'png' ? 'png' : 'jpeg';
            
            const imageId = workbook.addImage({
              buffer: buffer,
              extension: imageType,
            });
            
            sheet.addImage(imageId, {
              tl: { col: 0, row: rowIndex - 1 },
              ext: { width: 50, height: 50 }
            });
          } catch (e) {
            console.error('Failed to add image to excel', e);
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const filename = `${(settings.companyName || 'Export').replace(/\s+/g, '_')}_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer]), filename);
      
      setHistoryLogs(prev => [
        { id: `XP-${Math.floor(9000 + Math.random() * 999)}-X`, target: selectedCategories.length > 0 ? "Filtered Registry" : "Core Registry", format: ".XLSX", size: `${(buffer.byteLength / (1024 * 1024)).toFixed(1)} MB`, status: "COMPLETED", date: new Date().toLocaleDateString("en-GB") },
        ...prev
      ]);
      setShowModal(false);
    } catch (e) {
      alert("Failed to export Excel: " + (e instanceof Error ? e.message : String(e)));
      setHistoryLogs(prev => [
        { id: `XP-${Math.floor(9000 + Math.random() * 999)}-X`, target: "Core Registry", format: ".XLSX", size: "--", status: "FAILED", date: new Date().toLocaleDateString("en-GB") },
        ...prev
      ]);
    }
    setExporting(false);
  };

  const handlePDFExport = async () => {
    setExporting(true);
    try {
      const allProducts = await fetchCatalogData();
      const products = selectedCategories.length > 0 
        ? allProducts.filter(p => selectedCategories.includes(p.category))
        : [...allProducts];

      products.sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'pt', 'a4');
      
      doc.setFillColor(11, 19, 38); 
      doc.rect(0, 0, doc.internal.pageSize.width, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text(`${settings.companyName} Catalogue`, 40, 38);
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 40, 38, { align: 'right' });

      const bodyData: Array<{image: string | null, name: string, category: string, cost: string, wholesale: string, retail: string}> = [];
      for (const p of products) {
         let imgData: string | null = null;
         try {
           if (p.image_url) {
             imgData = (await getBase64ImageFromUrl(p.image_url)) as string;
           }
         } catch(e) {}
         
         bodyData.push({
           image: imgData,
           name: p.name,
           category: p.category,
           cost: `KES ${p.buying_price?.toLocaleString() || '0'}`,
           wholesale: `KES ${p.wholesale_price?.toLocaleString() || '0'}`,
           retail: `KES ${p.retail_price?.toLocaleString() || '0'}`
         });
      }

      autoTable(doc, {
        startY: 80,
        margin: { top: 80, left: 40, right: 40 },
        head: [['Image', 'Product Name', 'Category', 'Cost Price', 'Wholesale', 'Retail']],
        body: bodyData.map(row => [{content: '', rowData: row}, row.name, row.category, row.cost, row.wholesale, row.retail]),
        theme: 'striped',
        rowPageBreak: 'avoid',
        headStyles: { fillColor: [76, 215, 246], textColor: 11, fontStyle: 'bold' },
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, minCellHeight: 50, valign: 'middle', overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 50 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 100 },
          3: { cellWidth: 90 },
          4: { cellWidth: 90 },
          5: { cellWidth: 90 }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            const raw = data.cell.raw as { rowData?: { image?: string | null } };
            const rowData = raw?.rowData;
            if (rowData && rowData.image) {
              try {
                doc.addImage(rowData.image as string, 'JPEG', data.cell.x + 5, data.cell.y + 5, 40, 40);
              } catch(e){}
            }
          }
        }
      });

      const filename = `${(settings.companyName || 'Export').replace(/\s+/g, '_')}_Catalog_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      setHistoryLogs(prev => [
        { id: `XP-${Math.floor(9000 + Math.random() * 999)}-P`, target: selectedCategories.length > 0 ? "Filtered Registry" : "Core Registry", format: ".PDF", size: `4.5 MB`, status: "COMPLETED", date: new Date().toLocaleDateString("en-GB") },
        ...prev
      ]);
      setShowModal(false);
    } catch (e) {
      alert("Failed to export PDF: " + (e instanceof Error ? e.message : String(e)));
      setHistoryLogs(prev => [
        { id: `XP-${Math.floor(9000 + Math.random() * 999)}-P`, target: "Core Registry", format: ".PDF", size: "--", status: "FAILED", date: new Date().toLocaleDateString("en-GB") },
        ...prev
      ]);
    }
    setExporting(false);
  };

  const handleShareLink = async () => {
    setExporting(true);
    const baseUrl = window.location.origin;
    let url = baseUrl + "/";
    if (selectedCategories.length > 0) {
      url += `?category=${encodeURIComponent(selectedCategories.join(','))}&strict=true`;
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setHistoryLogs(prev => [
        { id: `XP-${Math.floor(9000 + Math.random() * 999)}-L`, target: selectedCategories.length > 0 ? "Restricted Catalog Link" : "Core Catalog Link", format: "LINK", size: "--", status: "COMPLETED", date: new Date().toLocaleDateString("en-GB") },
        ...prev
      ]);
      alert("Share Link copied to clipboard!");
      setShowModal(false);
    } catch(e) {
      alert("Failed to copy link.");
    }
    setExporting(false);
  };

  const handleInitializeExport = () => {
    if (selectedFormat === "excel") {
      handleExcelExport();
    } else if (selectedFormat === "pdf") {
      handlePDFExport();
    } else {
      handleShareLink();
    }
  };

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-apex-primary"></div>
            <h2 className="font-apex-sans text-3xl font-black text-apex-text uppercase tracking-tight">REGISTRY: DATA EXPORTS</h2>
          </div>
          <p className="font-apex-mono text-[10px] text-apex-secondary mt-2 tracking-widest uppercase">
            ARCHIVE_QUERY: [FILTER=CATALOGUE_ALL] | RECORDS_TOTAL: {historyLogs.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 bg-apex-surface-low border border-apex-outline-variant/30 text-apex-on-surface-variant hover:text-apex-text px-4 py-2.5 font-apex-sans font-bold text-[11px] tracking-wider uppercase transition-colors rounded">
            <Filter size={14} /> Refine View
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-apex-primary hover:brightness-110 text-apex-bg font-apex-sans font-bold text-[11px] tracking-widest uppercase px-5 py-2.5 rounded shadow-[0_0_15px_rgba(192,193,255,0.3)] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} /> Export Data
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-apex-surface-low border border-apex-outline-variant/20 rounded flex flex-col relative overflow-hidden">
        
        {/* Table Canvas */}
        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface/80 border-b border-apex-outline-variant/20 font-apex-sans font-bold text-[10px] text-apex-on-surface-variant/80 uppercase tracking-widest">
                <th className="py-4 px-6 font-bold w-24">FORMAT</th>
                <th className="py-4 px-6 font-bold">EXPORT TARGET</th>
                <th className="py-4 px-6 font-bold">FILE TYPE</th>
                <th className="py-4 px-6 font-bold text-center">STATUS</th>
                <th className="py-4 px-6 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant/10 text-apex-text">
              {historyLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40 font-apex-mono">
                    <Database size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                    <p className="font-bold text-xs uppercase tracking-widest">NO EXPORT REGISTRIES DETECTED</p>
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-apex-surface/40 transition-colors group">
                      {/* FORMAT VISUAL */}
                      <td className="py-3 px-6">
                        <div className={`w-12 h-10 bg-apex-surface-lowest border flex items-center justify-center shrink-0 group-hover:border-apex-primary/50 transition-colors ${log.status === "COMPLETED" ? "border-apex-primary/30 text-apex-primary shadow-[0_0_10px_rgba(192,193,255,0.1)]" : "border-apex-outline-variant/30 text-apex-on-surface-variant group-hover:text-apex-primary/80"}`}>
                          {log.format === ".XLSX" ? <FileSpreadsheet size={16} /> : log.format === "LINK" ? <Share2 size={16} /> : <FileText size={16} />}
                        </div>
                      </td>
                      
                      {/* EXPORT TARGET */}
                      <td className="py-3 px-6">
                        <p className="font-apex-sans font-bold text-sm tracking-wide text-apex-text">{log.target}</p>
                        <p className="font-apex-mono text-[9px] text-apex-secondary tracking-widest uppercase mt-0.5">SIZE: {log.size} {"//"} {log.date}</p>
                      </td>

                      {/* FILE TYPE */}
                      <td className="py-3 px-6 font-apex-mono text-xs text-apex-on-surface-variant tracking-wider uppercase">
                        {log.format}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-block px-2 py-0.5 border font-apex-mono text-[9px] font-bold tracking-widest uppercase ${
                          log.status === "FAILED"
                            ? "bg-apex-surface-lowest border-apex-outline-variant/30 text-apex-on-surface-variant"
                            : "border-apex-primary/30 bg-apex-primary/10 text-apex-primary shadow-[0_0_10px_rgba(192,193,255,0.1)]"
                        }`}>
                          {log.status}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-3 px-6 text-center">
                        {log.status === "COMPLETED" ? (
                          <button 
                            className="bg-apex-primary/20 text-apex-primary border border-apex-primary/50 px-3 py-1.5 font-apex-mono text-[9px] font-bold uppercase rounded tracking-widest hover:bg-apex-primary/30 transition-colors shadow-[0_0_10px_rgba(192,193,255,0.2)] flex items-center gap-2 mx-auto"
                            onClick={() => {
                              if (log.format === "LINK") {
                                alert("Share link already generated!");
                              }
                            }}
                          >
                            {log.format === "LINK" ? (
                              <><Share2 size={12} /> COPIED</>
                            ) : (
                              <><Download size={12} /> DOWNLOAD</>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="text-apex-on-surface-variant/50 hover:text-apex-text transition-colors p-2 flex items-center gap-2 mx-auto font-apex-mono text-[9px] uppercase tracking-widest"
                          >
                            <RefreshCcw size={12} /> RETRY
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
        
        {/* Registry Footer Pagination */}
        <div className="px-6 py-4 bg-apex-bg border-t border-apex-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-apex-mono text-[10px] text-apex-on-surface-variant/70 tracking-widest uppercase">
          <div className="flex items-center gap-4">
            <span>SHOWING ENTRY {historyLogs.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, historyLogs.length)} OF {historyLogs.length}</span>
            <div className="w-24 h-1 bg-apex-surface rounded-full overflow-hidden flex">
              <div className="h-full bg-apex-primary" style={{ width: `${historyLogs.length ? ((Math.min(startIndex + itemsPerPage, historyLogs.length)) / historyLogs.length) * 100 : 0}%` }}></div>
            </div>
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

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-apex-sans">
          <div
            className="absolute inset-0 bg-apex-bg/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-apex-bg p-8 w-full max-w-2xl shadow-[0_0_30px_rgba(192,193,255,0.1)] rounded border border-apex-primary/30 text-apex-text apex-scanline-effect">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-apex-outline-variant/30">
              <h2 className="text-xl font-apex-sans font-black text-apex-text uppercase">
                EXPORT CONFIGURATION
              </h2>
              <div className="flex items-center gap-2 bg-apex-surface-low border border-apex-outline-variant/30 p-1 rounded font-apex-mono text-xs">
                <button 
                  onClick={() => setSelectedFormat("pdf")}
                  className={`px-4 py-1.5 rounded transition-all duration-250 ${
                    selectedFormat === "pdf"
                      ? "bg-apex-primary text-apex-bg font-bold shadow-[0_0_10px_rgba(192,193,255,0.2)]" 
                      : "text-apex-on-surface-variant hover:text-apex-primary"
                  }`}
                >
                  PDF
                </button>
                <button 
                  onClick={() => setSelectedFormat("excel")}
                  className={`px-4 py-1.5 rounded transition-all duration-250 ${
                    selectedFormat === "excel"
                      ? "bg-apex-primary text-apex-bg font-bold shadow-[0_0_10px_rgba(192,193,255,0.2)]" 
                      : "text-apex-on-surface-variant hover:text-apex-primary"
                  }`}
                >
                  EXCEL
                </button>
                <button 
                  onClick={() => setSelectedFormat("link")}
                  className={`px-4 py-1.5 rounded transition-all duration-250 ${
                    selectedFormat === "link"
                      ? "bg-apex-primary text-apex-bg font-bold shadow-[0_0_10px_rgba(192,193,255,0.2)]" 
                      : "text-apex-on-surface-variant hover:text-apex-primary"
                  }`}
                >
                  SHARE LINK
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category Filter checklist */}
              <div>
                <label className="font-apex-mono text-[10px] text-apex-primary block mb-3 uppercase tracking-widest">
                  Target Sectors
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-2.5 bg-apex-surface-low border border-apex-outline-variant/10 rounded cursor-pointer hover:border-apex-primary/30 transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded text-apex-primary focus:ring-apex-primary bg-apex-bg border-apex-outline-variant"
                      />
                      <span className="font-apex-sans text-xs text-apex-text font-semibold">{cat}</span>
                    </label>
                  ))}
                  {categories.length === 0 && <span className="font-apex-mono text-xs text-apex-on-surface-variant/40">Loading sectors...</span>}
                </div>
              </div>

              {/* Schema filters selection */}
              <div>
                <label className="font-apex-mono text-[10px] text-apex-primary block mb-3 uppercase tracking-widest">
                  Schema Column Filters
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["SKU_ID", "VAL_UNIT", "TIMESTAMP", "GEO_TAG", "STATUS_FLG", "OPER_ID", "PRIORITY", "METADATA"].map((col, idx) => (
                    <label key={idx} className="flex items-center gap-2 p-2 bg-apex-surface-low border border-apex-outline-variant/10 rounded cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        defaultChecked={idx !== 3 && idx !== 5 && idx !== 7}
                        className="rounded text-apex-primary focus:ring-apex-primary bg-apex-bg border-apex-outline-variant"
                      />
                      <span className="font-apex-mono text-[11px] text-apex-on-surface-variant/80">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-8 mt-4 border-t border-apex-outline-variant/30">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-apex-surface-low hover:bg-apex-surface border border-apex-outline-variant/30 text-apex-text text-xs font-apex-mono uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                ABORT
              </button>
              <button
                onClick={handleInitializeExport}
                disabled={exporting}
                className="flex-1 py-2.5 bg-apex-primary hover:brightness-110 text-apex-bg text-xs font-apex-sans font-bold uppercase tracking-wider rounded disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(192,193,255,0.2)]"
              >
                {exporting && <RefreshCw size={14} className="animate-spin" />}
                {exporting ? "INITIALIZING EXPORT..." : "AUTHORIZE EXPORT"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
