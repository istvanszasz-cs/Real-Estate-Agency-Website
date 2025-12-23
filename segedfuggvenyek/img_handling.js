import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const uploadDir = './uploads';
const multerUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

export function upload(request, response, next) {
  multerUpload.single('file')(request, response, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.log('File size too large!');
        request.err = 'A fájl mérete túl nagy (max 2MB)!';
        return next();
      }
    } else if (err) {
      console.log(err);
      request.err = 'Valami hiba történt, próbáld újra később!';
      return next();
    }

    if (!request.file) {
      request.err = 'Fájl megadása kötelező!';
      return next();
    }

    const kiterjesztes = path.extname(request.file.originalname);
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(kiterjesztes.toLowerCase())) {
      request.err = 'Hiba: Érvénytelen fájltípus! Csak képfájlok engedélyezettek.';
      try {
        await fs.unlink(request.file.path);
        console.log('Unlink sikeres!');
      } catch {
        console.log('Unlink sikertelen!');
      }
      return next();
    }

    return next();
  });
}

export async function checkUploadsDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
