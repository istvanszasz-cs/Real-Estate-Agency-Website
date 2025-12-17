import { Router } from 'express';
import { executeQuery } from '../dal.js';

const router = new Router();

router.get('/', async (request, response) => {
  try {
    const talalatok = await executeQuery({});
    response.render('fooldal', { talalatok });
  } catch (err) {
    console.error(err);
    response.status(400).render('hiba', { hiba: 'Hiba a lakások lekérdezése során.' });
  }
});

router.get('/kereses', async (request, response) => {
  const felhasznaloNev = String(request.query.felhasznaloNev);
  const minAr = Number(request.query.min_ar) || 0;
  const maxAr = Number(request.query.max_ar) || Infinity;
  const minSzoba = Number(request.query.min_szoba) || 0;
  const maxSzoba = Number(request.query.max_szoba) || Infinity;
  const varos = request.query.varos ? request.query.varos.toString().toLowerCase() : '';
  const negyed = request.query.negyed ? request.query.negyed.toString().toLowerCase() : '';
  try {
    const talalatok = await executeQuery({
      felhasznaloNev: { $regex: felhasznaloNev, $options: 'i' },
      ar: { $gte: minAr, $lte: maxAr },
      szoba: { $gte: minSzoba, $lte: maxSzoba },
      varos: { $regex: varos, $options: 'i' },
      negyed: { $regex: negyed, $options: 'i' },
    });
    response.render('fooldal', { talalatok });
  } catch (err) {
    console.log(err);
    response.status(500).render('hiba', { hiba: 'A kereses sikertelen, probald ujra kesobb!' });
  }
});

router.get('/ujratoltes', async (request, response) => {
  try {
    const talalatok = await executeQuery({});
    response.render('fooldal', { talalatok });
  } catch (err) {
    console.log(err);
    response.status(400).render('hiba', { hiba: 'Hiba történt az oldal betöltése során, próbáld újra később!' });
  }
});

export default router;
