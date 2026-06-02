import { useState, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  cell?: (value: unknown, row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  searchValue?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  className?: string;
  hidePagination?: boolean;
  hideSearch?: boolean;
  hideFilters?: boolean;
  filters?: ReactNode;
  sortable?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onRowClick,
  page = 1,
  totalPages = 1,
  total,
  onPageChange,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
  searchPlaceholder = 'Buscar...',
  onSearch,
  searchValue = '',
  emptyTitle = 'Sin datos',
  emptyDescription,
  emptyAction,
  selectedIds = [],
  onSelectionChange,
  className,
  hidePagination = false,
  hideSearch = false,
  hideFilters = false,
  filters,
  sortable = true,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSort = (column: Column<T>) => {
    if (!sortable || !column.sortable) return;
    const key = String(column.accessor);
    if (sortColumn === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearch?.(value);
  };

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === data.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(data.map((row) => keyExtractor(row)));
    }
  };

  const renderCell = (row: T, column: Column<T>) => {
    const value =
      typeof column.accessor === 'function'
        ? column.accessor(row)
        : row[column.accessor];
    if (column.cell) return column.cell(value, row);
    if (value == null) return <span className="text-slate-500">—</span>;
    return String(value);
  };

  // Estados
  if (isLoading) {
    return <LoadingState text="Cargando datos..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={errorMessage || 'Error al cargar los datos'}
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de herramientas */}
      {(!hideSearch || !hideFilters) && (
        <div className="flex items-center gap-3 flex-wrap">
          {!hideSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          )}
          {!hideFilters && filters && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              {onSelectionChange && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === data.length && data.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                  />
                </th>
              )}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider',
                    sortable && column.sortable && 'cursor-pointer select-none hover:text-slate-200',
                    column.headerClassName
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1.5">
                    {column.header}
                    {sortable && column.sortable && (
                      <span className="text-slate-600">
                        {sortColumn === String(column.accessor) ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedData.map((row) => {
              const id = keyExtractor(row);
              const isSelected = selectedIds.includes(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer',
                    isSelected
                      ? 'bg-blue-500/5 hover:bg-blue-500/10'
                      : 'hover:bg-slate-800/30'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {onSelectionChange && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                      />
                    </td>
                  )}
                  {columns.map((column, idx) => (
                    <td
                      key={idx}
                      className={cn(
                        'px-4 py-3 text-sm text-slate-300 whitespace-nowrap',
                        column.className
                      )}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!hidePagination && totalPages !== undefined && (
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            {total !== undefined && (
              <span>
                {total > 0 ? (
                  <>
                    Mostrando{' '}
                    <span className="text-slate-300 font-medium">
                      {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
                    </span>{' '}
                    de{' '}
                    <span className="text-slate-300 font-medium">
                      {total}
                    </span>{' '}
                    registros
                  </>
                ) : (
                  'Sin registros'
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pageSizeOptions && onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      pageNum === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
