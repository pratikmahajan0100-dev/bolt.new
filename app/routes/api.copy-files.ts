// server.ts
import http from 'http';
import { parse as parseUrl } from 'url';
import fs from 'fs/promises';
import path from 'path';

interface FileContent {
  type: string;
  content: string;
}

interface CopyFilesRequest {
  files: Record<string, FileContent>;
  targetDirectory: string;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();

    return;
  }

  const parsedUrl = parseUrl(req.url || '', true);

  if (parsedUrl.pathname === '/copy-files' && req.method === 'POST') {
    try {
      let body = '';

      for await (const chunk of req) {
        body += chunk;
      }

      const { files, targetDirectory } = JSON.parse(body) as CopyFilesRequest;

      await fs.mkdir(targetDirectory, { recursive: true });

      for (const [filePath, dirent] of Object.entries(files)) {
        if (dirent?.type === 'file' && dirent.content) {
          const fullPath = path.join(targetDirectory, filePath.startsWith('/') ? filePath.slice(1) : filePath);
          const dirPath = path.dirname(fullPath);

          await fs.mkdir(dirPath, { recursive: true });

          await fs.writeFile(fullPath, dirent.content);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error copying files:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to copy files' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
