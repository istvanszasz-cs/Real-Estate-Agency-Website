import { Router } from 'express';
import { insertIntoDatabase, getUsers } from '../segedfuggvenyek/dal.js';
import { authRequired } from '../segedfuggvenyek/login_functions.js';
import sanitize from 'mongo-sanitize';

const router = new Router();

router.get('/letrehozas', authRequired, async (request, response) => {
  try {
    const felhasznalok = await getUsers();
    response.render('ujlakas', { felhasznalok });
  } catch (err) {
    console.log(err);
    response.status(400).render('hiba', { hiba: 'Hiba történt, próbáld újra később.' });
  }
});

router.post('/letrehozas', authRequired, async (request, response) => {
  let felhasznalok = null;
  try {
    felhasznalok = await getUsers();
  } catch (err) {
    console.log(err);
    response.render('hiba', { hiba: 'Hiba történt a hirdetés beszúrása során.' });
  }
  const ujLakas = {
    varos: sanitize(String(request.body.varos)),
    negyed: sanitize(String(request.body.negyed)),
    terulet: sanitize(Number(request.body.terulet)),
    ar: sanitize(Number(request.body.ar)),
    szoba: sanitize(Number(request.body.szoba)),
    felhasznaloNev: sanitize(request.body.felhasznaloNev),
    datum: new Date(),
    kepURL: './uploads/no-image.png',
  };

  if (ujLakas.varos.trim() === '' || ujLakas.negyed.trim() === '') {
    response.status(500).render('ujlakas', {
      hiba: 'A mezők nem lehetnek üresek!',
      felhasznalok,
    });
    return;
  }

  if (isNaN(ujLakas.terulet) || isNaN(ujLakas.ar) || isNaN(ujLakas.szoba)) {
    response.status(500).render('ujlakas', {
      hiba: 'Hiba: A felszínterület, ár és szobák száma mezőknek kötelező értéket adni!',
      felhasznalok,
    });
    return;
  }

  if (ujLakas.terulet <= 0 || ujLakas.ar <= 0 || ujLakas.szoba <= 0) {
    response.status(500).render('ujlakas', {
      hiba: 'Hiba: A felszínterület, ár és szobák száma mezőknek kötelező pozitív értéket adni!',
      felhasznalok,
    });
    return;
  }

  if (ujLakas.szoba % 1 !== 0) {
    response.status(500).render('ujlakas', {
      hiba: 'Hiba: A szobák számának egész számnak kell lennie!',
      felhasznalok,
    });
    return;
  }
  try {
    await insertIntoDatabase(ujLakas);
    response.redirect('/ujratoltes');
  } catch (err) {
    console.log(err);
    response.render('hiba', { hiba: 'Hiba történt a hirdetés beszúrása során.' });
  }
});

export default router;
