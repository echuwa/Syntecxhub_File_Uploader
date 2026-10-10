import multer from 'multer';
import path from 'path';
import { ApiError } from './errorHandler.js';

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10);
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024; // in bytes

// In-memory buffer storage for streaming directly into MongoDB GridFS
const storage = multer.memoryStorage();

// File filter to prevent hazardous executables while supporting broad file formats
const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.vbs', '.scr', '.com'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExtensions.includes(ext)) {
    return cb(
      new ApiError(
        400,
        `File upload rejected: Executable files with extension "${ext}" are restricted for security reasons.`
      ),
      false
    );
  }

  // Accept file
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: parseInt(process.env.MAX_FILES_COUNT || '10', 10),
  },
  fileFilter,
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', parseInt(process.env.MAX_FILES_COUNT || '10', 10));
