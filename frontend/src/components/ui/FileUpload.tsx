import { useState, useCallback, type ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn, formatFileSize } from '@/lib/utils';
import {
  Upload,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  maxFiles?: number;
  maxSize?: number; // en bytes
  accept?: Record<string, string[]>;
  className?: string;
  children?: ReactNode;
  uploading?: boolean;
  progress?: number;
  files?: FileWithPreview[];
}

const defaultAccept = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-8 h-8 text-red-400" />,
  doc: <FileText className="w-8 h-8 text-blue-400" />,
  docx: <FileText className="w-8 h-8 text-blue-400" />,
  xls: <FileSpreadsheet className="w-8 h-8 text-emerald-400" />,
  xlsx: <FileSpreadsheet className="w-8 h-8 text-emerald-400" />,
  jpg: <FileImage className="w-8 h-8 text-purple-400" />,
  jpeg: <FileImage className="w-8 h-8 text-purple-400" />,
  png: <FileImage className="w-8 h-8 text-purple-400" />,
};

function getFileIcon(fileName: string): React.ReactNode {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return fileTypeIcons[ext] || <File className="w-8 h-8 text-slate-400" />;
}

export default function FileUpload({
  onFilesSelected,
  onFileRemove,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = defaultAccept,
  className,
  children,
  uploading = false,
  progress = 0,
  files: externalFiles,
}: FileUploadProps) {
  const [internalFiles, setInternalFiles] = useState<FileWithPreview[]>([]);
  const files = externalFiles ?? internalFiles;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : undefined,
        })
      );
      const updated = [...files, ...newFiles].slice(0, maxFiles);
      if (externalFiles === undefined) {
        setInternalFiles(updated);
      }
      onFilesSelected(updated);
    },
    [files, maxFiles, onFilesSelected, externalFiles]
  );

  const removeFile = (index: number) => {
    const file = files[index];
    if (file.preview) URL.revokeObjectURL(file.preview);
    const updated = files.filter((_, i) => i !== index);
    if (externalFiles === undefined) {
      setInternalFiles(updated);
    }
    onFileRemove?.(file);
    onFilesSelected(updated);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    onDropRejected: (rejections) => {
      const errors = rejections[0]?.errors.map((e) => e.message).join(', ');
      if (errors) console.warn('Archivos rechazados:', errors);
    },
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-500/5'
            : isDragReject
            ? 'border-red-500 bg-red-500/5'
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isDragActive && !isDragReject
                ? 'bg-blue-500/20 text-blue-400'
                : isDragReject
                ? 'bg-red-500/20 text-red-400'
                : 'bg-slate-700 text-slate-400'
            )}
          >
            <Upload className="w-6 h-6" />
          </div>
          {isDragActive ? (
            <p className="text-blue-400 font-medium">
              {isDragReject
                ? 'Tipo de archivo no soportado'
                : 'Suelta los archivos aquí'}
            </p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">
                Arrastra archivos o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-500">
                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG — Máx. {formatFileSize(maxSize)} por archivo
              </p>
            </>
          )}
        </div>
        {children}
      </div>

      {/* Lista de archivos */}
      <AnimatePresence>
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <motion.li
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
              >
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  {uploading && index === files.length - 1 && (
                    <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="bg-blue-500 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>
    </div>
  );
}
