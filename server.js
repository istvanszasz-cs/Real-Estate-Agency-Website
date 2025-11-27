import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import Datastore from 'nedb-promises';

const db = Datastore.create({
  filename: 'lakasok.db',
  autoload: true,
});

let id = 1;
const app = express();
app.use(express.static('.'));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
async function init() {
  const lakasok = await db.find({}).sort({ id: 1 });
  if (lakasok.length > 0) {
    id = lakasok[lakasok.length - 1].id + 1;
  }
}
const multerUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

app.post('/kep_feltoltes', multerUpload.single('file'), async (request, response) => {
  if (!request.file) {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: Nincs feltöltött fájl!');
    return;
  }

  const lakasId = Number(request.body.id);
  const lakas = await db.findOne({ id: lakasId });
  if (!lakas) {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: Nincs ilyen ID-jú lakás az adatbázisban!');
    return;
  }

  const kiterjesztes = path.extname(request.file.originalname);
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(kiterjesztes.toLowerCase())) {
    fs.unlinkSync(request.file.path);
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: Érvénytelen fájltípus! Csak képfájlok engedélyezettek.');
    return;
  }
  const ujEleresiUt = `${uploadDir}/lakas_${lakasId}_img${kiterjesztes}`;
  fs.renameSync(request.file.path, ujEleresiUt);

  lakas.kepURL = ujEleresiUt;
  await db.update({ id: lakasId }, { $set: { kepURL: ujEleresiUt } });

  response.set('Content-Type', 'text/plain; charset=utf-8');
  response.send(`Sikeres kép feltöltés! Lakás ID: ${lakasId}, Kép elérési út: ${ujEleresiUt}`);
});

app.post('/letrehozas', async (request, response) => {
  const ujLakas = {
    id,
    varos: request.body.varos,
    negyed: request.body.negyed,
    terulet: Number(request.body.terulet),
    ar: Number(request.body.ar),
    szoba: Number(request.body.szoba),
    kepURL: null,
  };

  if (ujLakas.varos.trim() === '' || ujLakas.negyed.trim() === '') {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: A város és negyed mezők nem lehetnek üresek!');
    return;
  }

  if (isNaN(ujLakas.terulet) || isNaN(ujLakas.ar) || isNaN(ujLakas.szoba)) {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: A felszínterület, ár és szobák száma mezőknek kötelező értéket adni!');
    return;
  }

  if (ujLakas.terulet <= 0 || ujLakas.ar <= 0 || ujLakas.szoba <= 0) {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: A felszínterület, ár és szobák száma mezőknek pozitív értéket kell adni!');
    return;
  }

  if (ujLakas.szoba % 1 !== 0) {
    response.set('Content-Type', 'text/plain; charset=utf-8');
    response.status(400).send('Hiba: A szobák számának egész számnak kell lennie!');
    return;
  }

  const uzenet = `A szerver sikeresen megkapta az információkat!:
  Lakás (város): ${request.body.varos}
  Lakás (negyed): ${request.body.negyed}
  Felszínterület: ${request.body.terulet}
  Ár: ${request.body.ar}
  Szobák száma: ${request.body.szoba}`;
  console.log(uzenet);
  await db.insert(ujLakas);

  response.set('Content-Type', 'text/plain; charset=utf-8');
  response.send(`Sikeres adatküldés!\nID: ${ujLakas.id}\n${uzenet}`);
  id++;
});

function megfelel(lakas, minAr, maxAr, minSzoba, maxSzoba, varos, negyed) {
  return (
    lakas.ar >= minAr &&
    lakas.ar <= maxAr &&
    lakas.szoba >= minSzoba &&
    lakas.szoba <= maxSzoba &&
    lakas.varos.toLowerCase().includes(varos) &&
    lakas.negyed.toLowerCase().includes(negyed)
  );
}

app.get('/kereses', async (request, response) => {
  const minAr = Number(request.query.min_ar) || 0;
  const maxAr = Number(request.query.max_ar) || Infinity;
  const minSzoba = Number(request.query.min_szoba) || 0;
  const maxSzoba = Number(request.query.max_szoba) || Infinity;
  const varos = request.query.varos ? request.query.varos.toString().toLowerCase() : '';
  const negyed = request.query.negyed ? request.query.negyed.toString().toLowerCase() : '';

  const lakasok = await db.find({});
  const talalatok = lakasok.filter((lakas) => megfelel(lakas, minAr, maxAr, minSzoba, maxSzoba, varos, negyed));
  response.set('Content-Type', 'application/json; charset=utf-8');
  response.send(JSON.stringify(talalatok));
});
app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

init();
