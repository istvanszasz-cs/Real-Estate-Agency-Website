import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { executeQuery, updateDatabase } from '../dal.js';
import sanitize from 'mongo-sanitize';
import { ObjectId } from 'mongodb';

const router = new Router();

const uploadDir = './uploads';

const multerUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const upload = (req, res, next) => {
  multerUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        console.log('File size too large!');
        return res.status(400).render('hiba', { hiba: 'A fájl mérete túl nagy (max 2MB)!' });
      }
    } else if (err) {
      console.log(err);
      return res.status(400).render('hiba', { hiba: 'Valami hiba történt, próbáld újra később!' });
    }
    next();
    return null; // dummy
  });
};

router.post('/kep_feltoltes', upload, async (request, response) => {
  const lakasId = sanitize(request.body.id);

  const lakasArray = await executeQuery({ _id: new ObjectId(lakasId) });
  if (lakasArray.length === 0) {
    response.status(400).render('hiba', { hiba: 'Hiba: Nem található a keresett ID az adatbázisban!' });
    return;
  }

  const lakas = lakasArray[0];

  if (!request.file) {
    console.error('A felhasznalo nem toltott fel kepet!');
    response.status(500).render('reszletes', { hiba: 'Kép kiválasztása kötelező!', lakas });
    return;
  }

  const kiterjesztes = path.extname(request.file.originalname);
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(kiterjesztes.toLowerCase())) {
    fs.unlinkSync(request.file.path);
    response.status(500).render('hiba', { hiba: 'Hiba: Érvénytelen fájltípus! Csak képfájlok engedélyezettek.' });
    return;
  }
  const ujEleresiUt = `./uploads/lakas_${lakasId}_img${kiterjesztes}`;
  fs.renameSync(request.file.path, ujEleresiUt);

  lakas.kepURL = ujEleresiUt;
  try {
    await updateDatabase({ _id: new ObjectId(lakasId) }, { kepURL: ujEleresiUt });
    const talalatok = await executeQuery({});
    response.render('fooldal', { talalatok });
  } catch (err) {
    console.log(err);
    response.status(400).render('hiba', { hiba: 'Hiba történt a feltöltésnél, próbáld újra később!' });
  }
});

router.get('/reszletes/:id', async (request, response) => {
  const lakasId = sanitize(request.params.id);
  try {
    const lakasArray = await executeQuery({ _id: new ObjectId(lakasId) });
    if (lakasArray.length === 0) {
      response.status(400).render('hiba', { hiba: 'A kép feltöltése sikertelen, próbáld újra később!' });
      return;
    }
    const lakas = lakasArray[0];
    response.render('reszletes', { lakas });
  } catch (err) {
    console.log(err);
    response.status(400).render('hiba', { hiba: 'Hiba: Az oldalt nem sikerült betölteni!' });
  }
});

export default router;
