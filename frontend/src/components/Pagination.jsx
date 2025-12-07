import React from "react";
import { Button } from "@/components/ui/button";

const Pagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemLabel = "entries", // e.g., "entries", "users", "grades", "documents"
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Left: Items per page selector */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-gray-600 dark:text-gray-400">entries</span>
      </div>

      {/* Center: Showing info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Showing <span className="text-gray-800 dark:text-white">{startItem}</span> to{" "}
        <span className="text-gray-800 dark:text-white">{endItem}</span> of{" "}
        <span className="text-gray-800 dark:text-white">{totalItems}</span> {itemLabel}
      </div>

      {/* Right: Page Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Previous
        </Button>
        
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {currentPage}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {totalPages || 1}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
