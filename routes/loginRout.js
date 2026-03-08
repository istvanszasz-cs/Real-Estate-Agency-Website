import { Router } from 'express';
import { checkPasswd, setSessionParams } from '../segedfuggvenyek/login_functions.js';
import { executeQueryByEmail } from '../segedfuggvenyek/dal.js';

const router = new Router();
router.get('/login', (req, res) => {
  res.render('bejelentkezes');
});

router.post('/login', async (req, res) => {
  try {
    const jelszo = req.body.jelszo;
    const email = req.body.email;
    const queryEredmeny = await executeQueryByEmail(email);

    if (!queryEredmeny || queryEredmeny.length === 0) {
      console.log('rossz query');
      return res.status(401).render('bejelentkezes', { hiba: 'Hibás email cím vagy jelszó!' });
    }

    const felhasznalo = queryEredmeny[0];

    if (!checkPasswd(jelszo, felhasznalo.so, felhasznalo.hash)) {
      return res.status(401).render('bejelentkezes', { hiba: 'Kicsikutyatarka' });
    }
    setSessionParams(req, felhasznalo);
  } catch (err) {
    console.error(err);
    return res.status(500).render('hiba', { hiba: 'Szerver hiba történt, próbáld újra később!' });
  }

  return res.redirect('/ujratoltes');
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/ujratoltes');
    }
    res.clearCookie('connect.sid'); // torli a sessionId-t
    return res.redirect('/ujratoltes');
  });
});

export default router;
