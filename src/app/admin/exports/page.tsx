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
  Database,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";

const getCompressedImageFromUrl = async (imageUrl: string, maxWidth = 800, quality = 0.8): Promise<string> => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
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
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "pdf">("excel");
  const [exporting, setExporting] = useState(false);
  const { settings } = useSettings();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [historyLogs, setHistoryLogs] = useState<ExportLog[]>([
    { id: "EXP-8921", target: "All Categories Export", format: ".XLSX", size: "1.2 MB", status: "COMPLETED", date: new Date().toLocaleDateString("en-GB") },
    { id: "EXP-8920", target: "Lighting & Electronics", format: ".PDF", size: "3.4 MB", status: "COMPLETED", date: new Date(Date.now() - 86400000).toLocaleDateString("en-GB") },
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 72;
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
        
      const exceljsModule = await import('exceljs');
      const ExcelJS = exceljsModule.default || exceljsModule;
      const fileSaverModule = await import('file-saver');
      const saveAs = fileSaverModule.saveAs || (fileSaverModule.default && fileSaverModule.default.saveAs) || fileSaverModule.default;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Catalog');

      sheet.columns = [
        { header: 'S/No', key: 'sno', width: 10 },
        { header: 'Image', key: 'image', width: 20 },
        { header: 'Item Name', key: 'name', width: 45 },
        { header: 'Wholesale Price', key: 'wholesale', width: 20 },
        { header: 'Retail Price', key: 'retail', width: 20 },
      ];

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const rowIndex = i + 2; 
        const row = sheet.addRow({
          sno: i + 1,
          name: p.name,
          wholesale: p.wholesale_price || 0,
          retail: p.retail_price || 0
        });
        row.height = 80; 

        if (p.image_url) {
          try {
            const compressedDataUrl = await getCompressedImageFromUrl(p.image_url, 200, 0.6);
            const base64Data = compressedDataUrl.split(',')[1];
            
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: 'jpeg',
            });
            
            sheet.addImage(imageId, {
              tl: { col: 1, row: rowIndex - 1 },
              ext: { width: 70, height: 70 }
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

      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF || jspdfModule;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const doc = new jsPDF('l', 'pt', 'a4');
      
      doc.setFillColor(11, 19, 38); 
      doc.rect(0, 0, doc.internal.pageSize.width, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text(`${settings.companyName} Catalogue`, 40, 38);
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 40, 38, { align: 'right' });

      const bodyData: Array<{sno: number, image: string | null, name: string, wholesale: string, retail: string}> = [];
      for (let i = 0; i < products.length; i++) {
         const p = products[i];
         let imgData: string | null = null;
         try {
           if (p.image_url) {
             imgData = await getCompressedImageFromUrl(p.image_url, 200, 0.6);
           }
         } catch(e) {}
         
         bodyData.push({
           sno: i + 1,
           image: imgData,
           name: p.name,
           wholesale: `KES ${p.wholesale_price?.toLocaleString() || '0'}`,
           retail: `KES ${p.retail_price?.toLocaleString() || '0'}`
         });
      }

      autoTable(doc, {
        startY: 80,
        margin: { top: 80, left: 40, right: 40, bottom: 40 },
        head: [['S/No', 'Image', 'Item Name', 'Wholesale Price', 'Retail Price']],
        body: bodyData.map(row => [row.sno, {content: '', rowData: row}, row.name, row.wholesale, row.retail]),
        theme: 'grid',
        rowPageBreak: 'avoid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', halign: 'center', valign: 'middle' },
        bodyStyles: { valign: 'middle' },
        styles: { font: 'helvetica', fontSize: 11, cellPadding: 8, minCellHeight: 80, overflow: 'linebreak' },
        columnStyles: { 
          0: { cellWidth: 40, halign: 'center' },
          1: { cellWidth: 80, halign: 'center' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 100, halign: 'right' },
          4: { cellWidth: 100, halign: 'right' }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const raw = data.cell.raw as { rowData?: { image?: string | null } };
            const rowData = raw?.rowData;
            if (rowData && rowData.image) {
              try {
                doc.addImage(rowData.image as string, 'JPEG', data.cell.x + 5, data.cell.y + 5, 70, 70);
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

  const handleInitializeExport = () => {
    if (selectedFormat === "excel") {
      handleExcelExport();
    } else if (selectedFormat === "pdf") {
      handlePDFExport();
    }
  };

  return (
    <div className="w-full min-h-screen font-apex-sans max-w-[1400px] mx-auto p-8 pt-6 space-y-8 select-none">
      
      {/* Header Section */}
      <div className="flex justify-between items-start pb-4">
        <div>
          <h2 className="text-3xl font-bold text-apex-text tracking-tight">Data Exports</h2>
          <p className="font-apex-sans text-sm text-apex-on-surface-variant mt-1">
            Manage your catalog exports • {historyLogs.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-apex-surface border border-apex-outline-variant text-apex-text hover:bg-apex-surface-low px-4 py-2 font-apex-sans text-sm font-medium transition-colors rounded-lg shadow-sm">
            <Filter size={16} /> Filter
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-apex-primary hover:bg-apex-primary/90 text-apex-bg font-apex-sans text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Export Data
          </button>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-apex-surface border border-apex-outline-variant rounded-xl flex flex-col relative overflow-hidden shadow-sm">
        
        {/* Table Canvas */}
        <div className="overflow-x-auto min-h-64">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-apex-surface-lowest border-b border-apex-outline-variant font-apex-sans text-xs text-apex-on-surface-variant uppercase tracking-wider font-medium">
                <th className="py-4 px-6 w-24">Format</th>
                <th className="py-4 px-6">Export Target</th>
                <th className="py-4 px-6">File Type</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-apex-outline-variant text-apex-text">
              {historyLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center flex-col items-center justify-center text-apex-on-surface-variant/40">
                    <Database size={48} className="mb-4 text-apex-outline/20 mx-auto" strokeWidth={1} />
                    <p className="font-medium text-sm">No Export History</p>
                  </td>
                </tr>
              ) : (
                visibleLogs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-apex-surface-lowest transition-colors group">
                      {/* FORMAT VISUAL */}
                      <td className="py-3 px-6">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${log.status === "COMPLETED" ? "bg-apex-primary/10 text-apex-primary" : "bg-apex-surface-highest text-apex-on-surface-variant group-hover:text-apex-text"}`}>
                          {log.format === ".XLSX" ? <FileSpreadsheet size={16} /> : log.format === "LINK" ? <Share2 size={16} /> : <FileText size={16} />}
                        </div>
                      </td>
                      
                      {/* EXPORT TARGET */}
                      <td className="py-3 px-6">
                        <p className="font-apex-sans font-medium text-sm text-apex-text">{log.target}</p>
                        <p className="font-apex-sans text-xs text-apex-on-surface-variant mt-0.5">{log.size} • {log.date}</p>
                      </td>

                      {/* FILE TYPE */}
                      <td className="py-3 px-6 font-apex-sans text-sm text-apex-on-surface-variant">
                        {log.format === "LINK" ? "Link Share" : log.format === ".XLSX" ? "Excel Document" : "PDF Document"}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-6 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-apex-sans text-xs font-medium transition-colors ${
                          log.status === "FAILED"
                            ? "bg-apex-error-container text-apex-error"
                            : log.status === "PENDING"
                            ? "bg-apex-secondary-container text-apex-secondary"
                            : "bg-apex-tertiary-container text-apex-tertiary"
                        }`}>
                          {log.status === "FAILED" ? "Failed" : log.status === "PENDING" ? "Processing" : "Ready"}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-3 px-6 text-center">
                        {log.status === "COMPLETED" ? (
                          <button 
                            className="bg-apex-primary text-apex-bg px-4 py-2 font-apex-sans text-xs font-medium rounded-lg hover:bg-apex-primary/90 transition-colors shadow-sm flex items-center gap-2 mx-auto"
                            onClick={() => {
                              if (log.format === "LINK") {
                                alert("Share link already generated!");
                              }
                            }}
                          >
                            {log.format === "LINK" ? (
                              <><Share2 size={14} /> Shared</>
                            ) : (
                              <><Download size={14} /> Download</>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="text-apex-on-surface-variant hover:text-apex-text transition-colors p-2 flex items-center gap-2 mx-auto font-apex-sans text-xs font-medium"
                          >
                            <RefreshCcw size={14} /> Retry
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
        {totalPages > 1 && (
          <div className="flex justify-center py-6 bg-apex-surface-lowest border-t border-apex-outline-variant">
            <div className="inline-flex items-center bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.05)] px-4 py-2.5 gap-3 border border-slate-50">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              >
                <ArrowLeft size={20} strokeWidth={2.5} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-medium transition-all ${
                        currentPage === page 
                          ? 'bg-[#6F7A8B] text-white shadow-sm' 
                          : 'bg-[#F1F3F5] text-slate-700 hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="text-slate-400 px-1">...</span>;
                }
                return null;
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-apex-sans">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-apex-bg p-8 w-full max-w-2xl shadow-xl rounded-xl border border-apex-outline-variant text-apex-text">
            
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-apex-outline-variant">
              <h2 className="text-xl font-apex-sans font-bold text-apex-text">
                Export Data
              </h2>
              <div className="flex items-center gap-1 bg-apex-surface border border-apex-outline-variant p-1 rounded-lg font-apex-sans text-sm">
                <button 
                  onClick={() => setSelectedFormat("pdf")}
                  className={`px-4 py-1.5 rounded-md transition-all duration-200 ${
                    selectedFormat === "pdf"
                      ? "bg-apex-primary text-apex-bg font-medium shadow-sm" 
                      : "text-apex-on-surface-variant hover:text-apex-text"
                  }`}
                >
                  PDF
                </button>
                <button 
                  onClick={() => setSelectedFormat("excel")}
                  className={`px-4 py-1.5 rounded-md transition-all duration-200 ${
                    selectedFormat === "excel"
                      ? "bg-apex-primary text-apex-bg font-medium shadow-sm" 
                      : "text-apex-on-surface-variant hover:text-apex-text"
                  }`}
                >
                  Excel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category Filter checklist */}
              <div>
                <label className="font-apex-sans text-sm font-medium text-apex-text block mb-3">
                  Categories to Export
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-3 bg-apex-surface border border-apex-outline-variant rounded-lg cursor-pointer hover:bg-apex-surface-low transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
                        className="rounded text-apex-primary focus:ring-apex-primary/30 bg-apex-bg border-apex-outline-variant"
                      />
                      <span className="font-apex-sans text-sm text-apex-text">{cat}</span>
                    </label>
                  ))}
                  {categories.length === 0 && <span className="font-apex-sans text-sm text-apex-on-surface-variant">Loading categories...</span>}
                </div>
              </div>

              {/* Schema filters selection */}
              <div>
                <label className="font-apex-sans text-sm font-medium text-apex-text block mb-3">
                  Include Columns
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["S/No", "Image", "Item Name", "Wholesale Price", "Retail Price"].map((col, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 bg-apex-surface border border-apex-outline-variant rounded-lg cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        defaultChecked={true}
                        disabled={true}
                        className="rounded text-apex-primary bg-apex-bg border-apex-outline-variant opacity-50 cursor-not-allowed"
                      />
                      <span className="font-apex-sans text-xs text-apex-on-surface-variant">{col}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-apex-on-surface-variant mt-4">
                  Note: The preset columns shown above will be included in the export.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-8 mt-4 border-t border-apex-outline-variant">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-apex-surface hover:bg-apex-surface-low border border-apex-outline-variant text-apex-text text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleInitializeExport}
                disabled={exporting}
                className="flex-1 py-2.5 bg-apex-primary hover:bg-apex-primary/90 text-apex-bg text-sm font-medium rounded-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {exporting && <RefreshCw size={14} className="animate-spin" />}
                {exporting ? "Generating Export..." : "Confirm Export"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
