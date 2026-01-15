import crypto from 'node:crypto';

const SALT_SIZE = 16;
export function createHash(jelszo) {
  const soBuffer = crypto.randomBytes(SALT_SIZE);
  const hash = crypto.createHash('sha512').update(jelszo).update(soBuffer).digest('base64');
  return {
    jelszooo: jelszo,
    so: soBuffer.toString('base64'),
    hash,
  };
}

export function checkPasswd(jelszo, soB64, kivantHashB64) {
  const kivantHash = Buffer.from(kivantHashB64, 'base64');
  const so = Buffer.from(soB64, 'base64');

  const hash = crypto.createHash('sha512').update(jelszo).update(so).digest();

  if (kivantHash.equals(hash)) {
    return true;
  }
  return false;
}

export function setSessionParams(req, felhasznalo) {
  req.session.userId = felhasznalo._id;
  req.session.email = felhasznalo.email;
  req.session.isLoggedIn = true;
  req.session.nev = felhasznalo.nev;
}

// middleware, hogy ellenorizzuk be van-e jelentkezve
export function authRequired(req, res, next) {
  if (req.session && req.session.isLoggedIn) {
    return next(); // minden ok
  }
  return res.render('bejelentkezes', { hiba: 'A kért művelethez be kell jelentkezned!' }); // nem ok, be kell jelentkezni
}
