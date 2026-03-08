import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { executeQuery, executeQueryByObjectID, updatePicture } from '../segedfuggvenyek/dal.js';
import sanitize from 'mongo-sanitize';
import { upload } from '../segedfuggvenyek/img_handling.js';
import { authRequired } from '../segedfuggvenyek/login_functions.js';

const router = new Router();

router.post('/kep_feltoltes', upload, async (request, response) => {
  const lakasId = sanitize(request.body.id);

  const lakasArray = await executeQueryByObjectID(lakasId);
  if (lakasArray.length === 0) {
    response.status(400).render('hiba', { hiba: 'A kép feltöltése sikertelen, próbáld újra később!' });
    return;
  }

  const lakas = lakasArray[0];
  const tulaj = request.session.nev === lakas.felhasznaloNev;

  if (request.err) {
    response.status(500).render('reszletes', { hiba: request.err, lakas, tulajdonos: tulaj });
  }

  const kiterjesztes = path.extname(request.file.originalname);

  const ujEleresiUt = `./uploads/lakas_${lakasId}_img${kiterjesztes}`;
  fs.rename(request.file.path, ujEleresiUt)
    .then(() => {
      console.log('Fájl sikeresen átnevezve');
    })
    .catch((err) => {
      console.error('Hiba az átnevezés során:', err);
    });

  lakas.kepURL = ujEleresiUt;
  try {
    await updatePicture(lakasId, ujEleresiUt);
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
    const lakasArray = await executeQueryByObjectID(lakasId);
    if (lakasArray.length === 0) {
      response.status(400).render('hiba', { hiba: 'Hiba: Nem található a keresett ID az adatbázisban!' });
      return;
    }
    const lakas = lakasArray[0];

    try {
      await fs.access(lakas.kepURL, fs.constants.R_OK);
    } catch {
      lakas.kepURL = './uploads/no-image.png';
    }
    // megnezzuk, ugyanaz-e a szemely, mint aki be van logginolva
    if (request.session.nev !== lakas.felhasznaloNev) {
      response.render('reszletes', { lakas, tulajdonos: false });
    } else {
      response.render('reszletes', { lakas, tulajdonos: true });
    }
  } catch (err) {
    console.log(err);
    response.status(400).render('hiba', { hiba: 'Hiba: Az oldalt nem sikerült betölteni!' });
  }
});

router.post('/kepTorles', authRequired, async (request, response) => {
  const lakasId = sanitize(request.body.id);
  try {
    const lakasArray = await executeQueryByObjectID(lakasId);
    const lakas = lakasArray[0];

    if (lakas.kepURL !== './uploads/no-image.png') {
      try {
        await fs.unlink(lakas.kepURL);
        const ujEleresiUt = './uploads/no-image.png';
        await updatePicture(lakasId, ujEleresiUt);
        response.json({ valasz: 'Kép sikeresen törölve!' });
      } catch (err) {
        console.log(err);
        response.status(500).json({ valasz: 'Kép törölése sikertelen!' });
      }
    } else {
      response.status(400).json({ valasz: 'Nincs kép feltöltve ehez az ingatlanhoz!' });
    }
  } catch (err) {
    console.log(err);
    response.status(500).json({ valasz: 'Hiba lépett fel az adatbázisban.' });
  }
});

export default router;
