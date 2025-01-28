// api/copy-files.ts
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.post('/copy-files', async (req, res) => {
  try {
    const { files, targetDirectory } = req.body;

    // ensure target directory exists
    await fs.mkdir(targetDirectory, { recursive: true });

    // copy each file
    for (const [filePath, dirent] of Object.entries(files)) {
      if (dirent?.type === 'file' && dirent.content) {
        const fullPath = path.join(targetDirectory, filePath.startsWith('/') ? filePath.slice(1) : filePath);
        const dirPath = path.dirname(fullPath);

        // ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });

        // write file
        await fs.writeFile(fullPath, dirent.content);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error copying files:', error);
    res.status(500).json({ error: 'Failed to copy files' });
  }
});

export default router;
