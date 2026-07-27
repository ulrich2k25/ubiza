import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';

import type { StoredFile } from './types/stored-file.interface';

@Injectable()
export class StorageService {
  async save(file: Express.Multer.File, folder: string): Promise<StoredFile> {
    const extension = extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;

    const uploadDirectory = join(process.cwd(), 'uploads', folder);
    const filePath = join(uploadDirectory, filename);

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    await fs.writeFile(filePath, file.buffer);

    return {
      url: `/uploads/${folder}/${filename}`,
      publicId: filename,
    };
  }

  async delete(fileUrl: string): Promise<void> {
    const relativePath = fileUrl.replace(/^[/\\]+/, '');
    const filePath = join(process.cwd(), relativePath);

    await fs.unlink(filePath).catch(() => undefined);
  }
}
