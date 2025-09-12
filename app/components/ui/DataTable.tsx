'use client';

import { memo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchable?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  onExport?: (data: any[]) => void;
  onRowClick?: (row: any) => void;
  className?: string;
  periodInfo?: {
    period: string;
    category: string;
    range: { start: Date; end: Date };
  };
  highlightRowId?: number | null;
  paginated?: boolean;
  pageSize?: number;
}

const DataTable = memo(({ 
  data, 
  columns, 
  searchable = true, 
  exportable = true,
  exportFilename = 'data',
  onExport,
  onRowClick,
  className = '',
  periodInfo,
  highlightRowId,
  paginated = false,
  pageSize = 10
}: DataTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(paginated ? pageSize : 20);

  // Filter data based on search query
  const filteredData = data.filter(row => {
    if (!searchQuery) return true;
    return columns.some(column => {
      const value = row[column.key];
      return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleExport = () => {
    if (onExport) {
      onExport(sortedData);
    } else {
      // Default PDF export
      const doc = new jsPDF();
      
      // Set font
      doc.setFont('helvetica');
      
      // Add title
      doc.setFontSize(16);
      doc.text('Data Export', 14, 22);
      
      // Add export date
      doc.setFontSize(10);
      doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add period information if available
      if (periodInfo) {
        const periodLabel = periodInfo.period.charAt(0).toUpperCase() + periodInfo.period.slice(1);
        const categoryLabel = periodInfo.category.charAt(0).toUpperCase() + periodInfo.category.slice(1);
        const startDate = periodInfo.range.start.toLocaleDateString();
        const endDate = periodInfo.range.end.toLocaleDateString();
        
        doc.text(`Period: ${periodLabel} (${startDate} - ${endDate})`, 14, 38);
        doc.text(`Category: ${categoryLabel}`, 14, 46);
      }
      
      // Prepare table data
      const tableData = sortedData.map(row => 
        columns.map(col => {
          const value = row[col.key];
          if (col.render) {
            // For rendered columns, try to extract text content
            if (typeof value === 'string') {
              return value;
            } else if (typeof value === 'number') {
              return value.toString();
            } else {
              return '';
            }
          }
          return value?.toString() || '';
        })
      );
      
      // Add table headers
      const headers = columns.map(col => col.label);
      
      // Create table
      const startY = periodInfo ? 54 : 40; // Adjust start position based on period info
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: startY,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185], // Blue color
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: startY },
      });
      
      // Save the PDF
      doc.save(`${exportFilename}.pdf`);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={`bg-[#1a1a1f] border border-neutral-800 rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <span className="text-sm text-neutral-400">
              {sortedData.length} of {data.length} items
            </span>
          </div>
          
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-900/20 border-t border-b border-blue-600/70">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-8 py-5 text-${column.align || 'center'} text-sm font-medium text-blue-200 ${
                    column.sortable ? 'cursor-pointer transition-all duration-200' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={`flex items-center gap-2 ${
                    column.align === 'left' ? 'justify-start' : 
                    column.align === 'right' ? 'justify-end' : 'justify-center'
                  } ${
                    column.sortable ? 'hover:bg-blue-800/30 hover:rounded-lg hover:outline hover:outline-1 hover:outline-blue-400/50 px-3 py-2 -mx-3 -my-2' : ''
                  }`}>
                    {column.label}
                    {column.sortable && (
                      <span className="text-xs text-blue-300">
                        {getSortIcon(column.key)}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {paginatedData.map((row, index) => {
              const isHighlighted = highlightRowId && row.id === highlightRowId;
              return (
                <tr
                  key={index}
                  className={`table-row transition-colors border border-transparent ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isHighlighted ? 'bg-blue-900/50 border-blue-500/50 shadow-lg' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                {columns.map((column) => (
                  <td key={column.key} className={`px-6 py-4 text-${column.align || 'center'} text-sm text-neutral-200`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="p-6 border-t border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-400">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 text-neutral-300 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-500 text-neutral-300 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

DataTable.displayName = 'DataTable';

export default DataTable;
