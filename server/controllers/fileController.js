import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import path from 'path';
import { getBucket } from '../config/db.js';
import { ApiError } from '../middleware/errorHandler.js';

// Helper: Format bytes to human-readable string
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Helper: Determine file category based on MIME type and extension
export function determineCategory(mimetype = '', filename = '') {
  const mime = mimetype.toLowerCase();
  const ext = path.extname(filename).toLowerCase();

  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.startsWith('audio/')) return 'Audio';
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('presentation') ||
    mime.includes('spreadsheet') ||
    ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.xls', '.xlsx', '.ppt', '.pptx', '.odt'].includes(ext)
  ) {
    return 'Document';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('compressed') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)
  ) {
    return 'Archive';
  }
  if (
    mime.includes('json') ||
    mime.includes('javascript') ||
    mime.includes('html') ||
    mime.includes('xml') ||
    ['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.html', '.css', '.md', '.sql', '.yaml', '.yml'].includes(ext)
  ) {
    return 'Code & Data';
  }
  return 'Other';
}

// Helper: Map GridFS raw document to API File object
function transformFileDoc(doc, baseUrl = '') {
  const category = doc.metadata?.category || determineCategory(doc.contentType || doc.metadata?.contentType, doc.filename);
  const originalName = doc.metadata?.originalName || doc.filename;
  const contentType = doc.contentType || doc.metadata?.contentType || 'application/octet-stream';
  const size = doc.length ?? doc.metadata?.size ?? 0;

  return {
    _id: doc._id.toString(),
    filename: doc.filename,
    originalName,
    length: size,
    size,
    formattedSize: formatBytes(size),
    chunkSize: doc.chunkSize,
    totalChunks: Math.ceil(size / (doc.chunkSize || 261120)),
    contentType,
    category,
    uploadDate: doc.uploadDate,
    description: doc.metadata?.description || '',
    uploader: doc.metadata?.uploader || 'Anonymous Intern',
    downloadUrl: `${baseUrl}/api/files/${doc._id}/download`,
    viewUrl: `${baseUrl}/api/files/${doc._id}/view`,
    metadataUrl: `${baseUrl}/api/files/${doc._id}`,
  };
}

// Stream upload buffer to GridFS
function saveBufferToGridFS(bucket, file, extraMeta = {}) {
  return new Promise((resolve, reject) => {
    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const contentType = file.mimetype || 'application/octet-stream';
    const category = determineCategory(contentType, file.originalname);

    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        originalName: file.originalname,
        contentType,
        size: file.size,
        extension: path.extname(file.originalname).toLowerCase(),
        category,
        description: extraMeta.description || '',
        uploader: extraMeta.uploader || 'SyntecxHub Intern',
        uploadedAt: new Date(),
      },
    });

    const readable = Readable.from(file.buffer);

    readable.pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id));
  });
}

/**
 * POST /api/files/upload
 * Single file upload via Multer multipart/form-data
 */
export async function uploadSingleFile(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file uploaded. Please send a file in the "file" form-data field.');
    }

    const bucket = getBucket();
    const fileId = await saveBufferToGridFS(bucket, req.file, {
      description: req.body.description,
      uploader: req.body.uploader,
    });

    const [fileDoc] = await bucket.find({ _id: fileId }).toArray();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      message: 'File successfully uploaded and stored in MongoDB GridFS.',
      file: transformFileDoc(fileDoc, baseUrl),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/files/upload-multiple
 * Multiple files upload via Multer multipart/form-data
 */
export async function uploadMultipleFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'No files uploaded. Please send files in the "files" form-data field.');
    }

    const bucket = getBucket();
    const uploadPromises = req.files.map((file) =>
      saveBufferToGridFS(bucket, file, {
        description: req.body.description,
        uploader: req.body.uploader,
      })
    );

    const fileIds = await Promise.all(uploadPromises);
    const fileDocs = await bucket.find({ _id: { $in: fileIds } }).toArray();
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      success: true,
      count: fileDocs.length,
      message: `Successfully uploaded ${fileDocs.length} files to MongoDB GridFS.`,
      files: fileDocs.map((doc) => transformFileDoc(doc, baseUrl)),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files
 * Retrieve list of files with search, filtering, sorting, and pagination
 */
export async function getAllFiles(req, res, next) {
  try {
    const bucket = getBucket();
    const {
      q,
      category,
      sort = 'newest',
      page = 1,
      limit = 50,
    } = req.query;

    const queryFilter = {};

    // Search query by filename or originalName
    if (q && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      queryFilter.$or = [
        { filename: { $regex: escaped, $options: 'i' } },
        { 'metadata.originalName': { $regex: escaped, $options: 'i' } },
        { 'metadata.description': { $regex: escaped, $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      queryFilter['metadata.category'] = category;
    }

    // Sorting
    let sortOptions = { uploadDate: -1 };
    switch (sort) {
      case 'oldest':
        sortOptions = { uploadDate: 1 };
        break;
      case 'largest':
        sortOptions = { length: -1 };
        break;
      case 'smallest':
        sortOptions = { length: 1 };
        break;
      case 'name_asc':
        sortOptions = { filename: 1 };
        break;
      case 'name_desc':
        sortOptions = { filename: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { uploadDate: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skipNum = (pageNum - 1) * limitNum;

    // Get total matching count
    const totalFiles = await bucket.find(queryFilter).toArray();
    const totalCount = totalFiles.length;

    // Fetch paginated results
    const cursor = bucket.find(queryFilter).sort(sortOptions).skip(skipNum).limit(limitNum);
    const docs = await cursor.toArray();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const files = docs.map((doc) => transformFileDoc(doc, baseUrl));

    res.status(200).json({
      success: true,
      data: files,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
        hasMore: pageNum * limitNum < totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/:id
 * Retrieve single file metadata by ObjectId
 */
export async function getFileById(req, res, next) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid file ID format: "${id}". Must be a 24-character hexadecimal ObjectId.`);
    }

    const bucket = getBucket();
    const [fileDoc] = await bucket.find({ _id: new ObjectId(id) }).toArray();

    if (!fileDoc) {
      throw new ApiError(404, `File not found in GridFS with ID: "${id}".`);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(200).json({
      success: true,
      file: transformFileDoc(fileDoc, baseUrl),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/:id/view
 * Stream file inline with partial byte range support (for previewing image/video/audio/pdf)
 */
export async function streamFile(req, res, next) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid file ID: "${id}".`);
    }

    const bucket = getBucket();
    const [fileDoc] = await bucket.find({ _id: new ObjectId(id) }).toArray();

    if (!fileDoc) {
      throw new ApiError(404, `File not found in GridFS with ID: "${id}".`);
    }

    const contentType = fileDoc.contentType || fileDoc.metadata?.contentType || 'application/octet-stream';
    const originalName = fileDoc.metadata?.originalName || fileDoc.filename;
    const fileSize = fileDoc.length;

    // Handle HTTP Range header for audio/video seek and partial streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(originalName)}"`,
      });

      const downloadStream = bucket.openDownloadStream(new ObjectId(id), {
        start,
        end: end + 1,
      });

      downloadStream.on('error', (err) => next(err));
      downloadStream.pipe(res);
      return;
    }

    // Standard stream
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    downloadStream.on('error', (err) => next(err));
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/:id/download
 * Force file download with attachment header
 */
export async function downloadFile(req, res, next) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid file ID: "${id}".`);
    }

    const bucket = getBucket();
    const [fileDoc] = await bucket.find({ _id: new ObjectId(id) }).toArray();

    if (!fileDoc) {
      throw new ApiError(404, `File not found in GridFS with ID: "${id}".`);
    }

    const contentType = fileDoc.contentType || fileDoc.metadata?.contentType || 'application/octet-stream';
    const originalName = fileDoc.metadata?.originalName || fileDoc.filename;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileDoc.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);

    const downloadStream = bucket.openDownloadStream(new ObjectId(id));
    downloadStream.on('error', (err) => next(err));
    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/files/:id
 * Delete file metadata and all associated chunks from MongoDB GridFS
 */
export async function deleteFile(req, res, next) {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      throw new ApiError(400, `Invalid file ID: "${id}".`);
    }

    const bucket = getBucket();
    const fileId = new ObjectId(id);

    // Verify file exists
    const [fileDoc] = await bucket.find({ _id: fileId }).toArray();
    if (!fileDoc) {
      throw new ApiError(404, `File with ID "${id}" does not exist in GridFS.`);
    }

    // Delete both file doc and all chunks in GridFS
    await bucket.delete(fileId);

    res.status(200).json({
      success: true,
      message: `File "${fileDoc.metadata?.originalName || fileDoc.filename}" and its GridFS chunks were deleted successfully.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/files/stats
 * Storage usage statistics and breakdown
 */
export async function getStorageStats(req, res, next) {
  try {
    const bucket = getBucket();
    const allFiles = await bucket.find({}).toArray();

    let totalBytes = 0;
    const categoryCount = {
      Image: 0,
      Video: 0,
      Audio: 0,
      Document: 0,
      Archive: 0,
      'Code & Data': 0,
      Other: 0,
    };
    const categoryBytes = {
      Image: 0,
      Video: 0,
      Audio: 0,
      Document: 0,
      Archive: 0,
      'Code & Data': 0,
      Other: 0,
    };

    allFiles.forEach((file) => {
      const size = file.length || 0;
      totalBytes += size;
      const cat = file.metadata?.category || determineCategory(file.contentType, file.filename);
      if (categoryCount[cat] !== undefined) {
        categoryCount[cat] += 1;
        categoryBytes[cat] += size;
      } else {
        categoryCount.Other += 1;
        categoryBytes.Other += size;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalFiles: allFiles.length,
        totalBytes,
        formattedTotalSize: formatBytes(totalBytes),
        categoryCount,
        categoryBytes: Object.entries(categoryBytes).reduce((acc, [k, v]) => {
          acc[k] = { bytes: v, formatted: formatBytes(v) };
          return acc;
        }, {}),
        averageFileSize: allFiles.length > 0 ? formatBytes(totalBytes / allFiles.length) : '0 Bytes',
      },
    });
  } catch (error) {
    next(error);
  }
}
