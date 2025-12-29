import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  pageSize, 
  onPageSizeChange, 
  totalElements 
}) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 px-2 border-t mt-4 text-sm text-slate-600">
      
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {[10, 20, 30, 50, 100].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      {/* Page Info */}
      <div className="flex items-center gap-2">
        <span>
          {totalElements > 0 ? (
            <>Showing <b>{startItem}</b> - <b>{endItem}</b> of <b>{totalElements}</b></>
          ) : (
            'No results'
          )}
        </span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>
        
        <span className="font-medium">
          Page {currentPage + 1} of {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
