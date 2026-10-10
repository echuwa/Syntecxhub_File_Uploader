import { Router } from 'express';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  getAllFiles,
  getFileById,
  streamFile,
  downloadFile,
  deleteFile,
  getStorageStats,
} from '../controllers/fileController.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = Router();

// Storage statistics
router.get('/stats', getStorageStats);

// Upload endpoints (Multer multipart/form-data)
router.post('/upload', uploadSingle, uploadSingleFile);
router.post('/upload-multiple', uploadMultiple, uploadMultipleFiles);

// File management & retrieval
router.get('/', getAllFiles);
router.get('/:id', getFileById);
router.get('/:id/view', streamFile);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
