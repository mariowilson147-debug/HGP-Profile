"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/actions";
import { FileSpreadsheet, Download, FileText, Clock, CheckCircle2, XCircle, RefreshCw, Share2, Save, Filter } from "lucide-react";
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

export default function ExportsHub() {
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const { settings } = useSettings();
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Automated Reports State
  const [reportEmail, setReportEmail] = useState("");
  const [reportFreq, setReportFreq] = useState("weekly");
  const [reportFormat, setReportFormat] = useState("pdf");

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

  const handleShare = async () => {
    let url = window.location.origin;
    if (selectedCategories.length > 0) {
      url += `/?category=${encodeURIComponent(selectedCategories.join(','))}&strict=true`;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard!");
    } catch (err) {
      alert("Could not copy to clipboard. Share link is: " + url);
    }
  };

  const handleExcelExport = async () => {
    setExportingExcel(true);
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
      saveAs(new Blob([buffer]), `${(settings.companyName || 'Export').replace(/\s+/g, '_')}_Catalog_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      alert("Failed to export Excel: " + (e instanceof Error ? e.message : String(e)));
      console.error(e);
    }
    setExportingExcel(false);
  };

  const handlePDFExport = async () => {
    setExportingPDF(true);
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
      
      doc.setFillColor(30, 41, 59); 
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
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
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

      doc.save(`${(settings.companyName || 'Export').replace(/\s+/g, '_')}_Catalog_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      alert("Failed to export PDF: " + (e instanceof Error ? e.message : String(e)));
      console.error(e);
    }
    setExportingPDF(false);
  };

  const handleSaveReportSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Automated report settings saved successfully!");
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-12 pt-12">

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Category Filter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Filter size={20} />
              <h3 className="text-lg font-display font-bold">Category Selection</h3>
            </div>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Share2 size={16} /> Share Link
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Select specific categories to include in your downloads. Share link will generate a URL for the selected categories.</p>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">{cat}</span>
              </label>
            ))}
            {categories.length === 0 && <span className="text-sm text-slate-400">Loading categories...</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Export Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <FileSpreadsheet size={120} />
            </div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <FileSpreadsheet size={24} />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-800">Download Catalog</h2>
            </div>
            
            <p className="text-slate-600 mb-8 max-w-md relative z-10 leading-relaxed text-sm">
              Comprehensive export containing product images, names, and all pricing tiers. Downloads will be filtered based on the category selection above.
            </p>
            
            <div className="flex gap-3 mb-10 relative z-10 flex-wrap">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">A4 LANDSCAPE</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">INCLUDES IMAGES</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">ALL PRICING TIERS</span>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-4 relative z-10">
              <button 
                onClick={handleExcelExport}
                disabled={exportingExcel}
                className="flex flex-1 items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl text-sm font-medium hover:bg-slate-900 transition-all shadow-sm disabled:opacity-70"
              >
                {exportingExcel ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />} 
                {exportingExcel ? "Generating Excel..." : "Download Excel"}
              </button>
              
              <button 
                onClick={handlePDFExport}
                disabled={exportingPDF}
                className="flex flex-1 items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-70"
              >
                {exportingPDF ? <RefreshCw size={18} className="animate-spin" /> : <FileText size={18} />} 
                {exportingPDF ? "Generating PDF..." : "Download PDF"}
              </button>
            </div>
          </div>

          {/* Automated Reports Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-slate-800" />
              <h3 className="text-lg font-display font-bold text-slate-800">Automated Reports</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Configure scheduled catalog distributions to your connected partners.
            </p>

            <form onSubmit={handleSaveReportSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recipient Email</label>
                <input 
                  type="email" 
                  required
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                <select 
                  value={reportFreq}
                  onChange={(e) => setReportFreq(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                <select 
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <Save size={16} /> Save Settings
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Recent Export History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Export Name</th>
                  <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-4 px-6 font-medium text-slate-700 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-slate-400" /> Custom_Wholesale_Q3.xlsx
                  </td>
                  <td className="p-4 px-6 text-slate-500 font-mono text-xs">Oct 24, 14:32</td>
                  <td className="p-4 px-6">
                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-max">
                      <CheckCircle2 size={12} /> COMPLETED
                    </span>
                  </td>
                  <td className="p-4 px-6 text-slate-500 text-xs">admin@catalogpro.com</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
