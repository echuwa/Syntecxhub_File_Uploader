import http from 'http';
import app from '../server/server.js';
import { connectDB, closeDB, getBucket } from '../server/config/db.js';

const TEST_PORT = 5005;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

let server;

async function runTests() {
  console.log('🧪 Starting SyntecxHub File Uploader API Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`📡 Test server listening on ${BASE_URL}\n`);

    // 1. Health check test
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/health returns 200 OK');
      assert(data.status === 'UP', 'Health status is UP');
      assert(data.database.status === 'Connected', 'MongoDB connection is confirmed');
    }

    // 2. Initial stats check
    {
      const res = await fetch(`${BASE_URL}/api/files/stats`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/files/stats returns 200 OK');
      assert(data.success === true, 'Stats response contains success flag');
      assert(typeof data.stats.totalFiles === 'number', 'Total files count is numeric');
    }

    // 3. Error Validation: Upload without file
    {
      const formData = new FormData();
      formData.append('description', 'Test upload without file');
      const res = await fetch(`${BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      assert(res.status === 400, 'POST /api/files/upload without file returns 400 Bad Request');
      assert(data.success === false, 'Error response contains success: false');
    }

    // 4. Single file upload
    let uploadedFileId;
    {
      const formData = new FormData();
      const testContent = 'SyntecxHub GridFS File Uploader Test Content - 2026';
      const fileBlob = new Blob([testContent], { type: 'text/plain' });
      formData.append('file', fileBlob, 'sample_syntecxhub.txt');
      formData.append('description', 'Automated test upload');
      formData.append('uploader', 'Test Agent');

      const res = await fetch(`${BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      assert(res.status === 201, 'POST /api/files/upload returns 201 Created');
      assert(data.success === true, 'Upload response contains success: true');
      assert(data.file._id !== undefined, 'Uploaded file has valid GridFS _id');
      assert(data.file.originalName === 'sample_syntecxhub.txt', 'Original filename preserved');
      assert(data.file.contentType === 'text/plain', 'MIME type correctly identified');
      uploadedFileId = data.file._id;
    }

    // 5. Query all files
    {
      const res = await fetch(`${BASE_URL}/api/files?q=sample_syntecxhub`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/files with query returns 200 OK');
      assert(Array.isArray(data.data), 'Files data is an array');
      assert(data.data.some((f) => f._id === uploadedFileId), 'Uploaded file is present in list');
    }

    // 6. Get single file metadata
    {
      const res = await fetch(`${BASE_URL}/api/files/${uploadedFileId}`);
      const data = await res.json();
      assert(res.status === 200, 'GET /api/files/:id returns 200 OK');
      assert(data.file._id === uploadedFileId, 'Retrieved metadata matches uploaded ID');
      assert(data.file.totalChunks >= 1, 'Chunk count calculation is correct');
    }

    // 7. Stream/View file
    {
      const res = await fetch(`${BASE_URL}/api/files/${uploadedFileId}/view`);
      const content = await res.text();
      assert(res.status === 200, 'GET /api/files/:id/view returns 200 OK');
      assert(res.headers.get('content-type') === 'text/plain', 'Stream Content-Type matches');
      assert(content.includes('SyntecxHub GridFS'), 'Stream content matches uploaded data');
    }

    // 8. Download file
    {
      const res = await fetch(`${BASE_URL}/api/files/${uploadedFileId}/download`);
      const disposition = res.headers.get('content-disposition');
      assert(res.status === 200, 'GET /api/files/:id/download returns 200 OK');
      assert(disposition && disposition.includes('attachment'), 'Content-Disposition is attachment');
    }

    // 9. Batch upload multiple files
    let batchIds = [];
    {
      const formData = new FormData();
      formData.append('files', new Blob(['Batch file 1'], { type: 'text/plain' }), 'batch_1.txt');
      formData.append('files', new Blob(['Batch file 2'], { type: 'text/plain' }), 'batch_2.txt');
      formData.append('description', 'Batch upload test');

      const res = await fetch(`${BASE_URL}/api/files/upload-multiple`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      assert(res.status === 201, 'POST /api/files/upload-multiple returns 201 Created');
      assert(data.count === 2, 'Batch count equals 2');
      batchIds = data.files.map((f) => f._id);
    }

    // 10. Delete file
    {
      const res = await fetch(`${BASE_URL}/api/files/${uploadedFileId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      assert(res.status === 200, 'DELETE /api/files/:id returns 200 OK');
      assert(data.success === true, 'Delete response confirms success');

      // Verify file is gone
      const verifyRes = await fetch(`${BASE_URL}/api/files/${uploadedFileId}`);
      assert(verifyRes.status === 404, 'Subsequent GET /api/files/:id returns 404 Not Found');
    }

    // Clean up batch test files
    for (const id of batchIds) {
      await fetch(`${BASE_URL}/api/files/${id}`, { method: 'DELETE' });
    }

    // 11. Invalid ID validation
    {
      const res = await fetch(`${BASE_URL}/api/files/invalid-mongo-id-123`);
      const data = await res.json();
      assert(res.status === 400, 'GET /api/files/invalid-id returns 400 Bad Request');
      assert(data.message.includes('Invalid file ID format'), 'Error message is clear and informative');
    }

    console.log(`\n🏁 Test Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDB();
  }
}

runTests();
