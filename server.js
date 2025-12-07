import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { connectToDatabase, insertIntoDatabase, executeQuery, updateDatabase, getUsers } from './dal.js';
import sanitize from 'mongo-sanitize';
import { ObjectId } from 'mongodb';

const app = express();
app.use(express.static('.'));
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

async function init() {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
const multerUpload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

app.get('/', async (request, response) => {
  try {
    const talalatok = await executeQuery({});
    response.render('fooldal', { talalatok });
  } catch (err) {
    console.error(`ERROR NUM: 500 ${err}`);
    response.render('fooldal', { talalatok: [], hiba: 'Hiba a lakások lekérdezése során.' });
  }
});

app.post('/kep_feltoltes', multerUpload.single('file'), async (request, response) => {
  if (!request.file) {
    console.error(`ERROR NUM: 400`);
    const lakas = null;
    response.render('reszletes', { hiba: 'Hiba: Nincs fájl kiválasztva a feltöltéshez!', lakas });
    return;
  }

  const lakasId = sanitize(request.body.id);

  const lakasArray = await executeQuery({ _id: new ObjectId(lakasId) });
  if (lakasArray.length === 0) {
    console.error(`ERROR NUM: 400`);
    response.render('reszletes', { hiba: 'Hiba: Nem található a keresett ID az adatbázisban!' });
    return;
  }
  const lakas = lakasArray[0];

  const kiterjesztes = path.extname(request.file.originalname);
  if (!['.jpg', '.jpeg', '.png', '.gif'].includes(kiterjesztes.toLowerCase())) {
    fs.unlinkSync(request.file.path);
    console.error(`ERROR NUM: 400`);
    response.render('reszletes', { hiba: 'Hiba: Érvénytelen fájltípus! Csak képfájlok engedélyezettek.' });
    return;
  }
  const ujEleresiUt = `./uploads/lakas_${lakasId}_img${kiterjesztes}`;
  fs.renameSync(request.file.path, ujEleresiUt);

  lakas.kepURL = ujEleresiUt;
  await updateDatabase({ _id: new ObjectId(lakasId) }, { kepURL: ujEleresiUt });
  const talalatok = await executeQuery({});
  response.render('fooldal', { talalatok });
});

app.get('/letrehozas', async (request, response) => {
  const felhasznalok = await getUsers();
  response.render('ujlakas', { felhasznalok });
});

app.post('/letrehozas', async (request, response) => {
  const ujLakas = {
    varos: sanitize(String(request.body.varos)),
    negyed: sanitize(String(request.body.negyed)),
    terulet: sanitize(Number(request.body.terulet)),
    ar: sanitize(Number(request.body.ar)),
    szoba: sanitize(Number(request.body.szoba)),
    felhasznaloNev: sanitize(request.body.felhasznaloNev),
  };

  if (ujLakas.varos.trim() === '' || ujLakas.negyed.trim() === '') {
    response.render('ujlakas', { hiba: 'A mezők nem lehetnek üresek!' });
    return;
  }

  if (isNaN(ujLakas.terulet) || isNaN(ujLakas.ar) || isNaN(ujLakas.szoba)) {
    console.error(`ERROR NUM: 400`);
    response.render('fooldal', { hiba: 'Hiba: A felszínterület, ár és szobák száma mezőknek kötelező értéket adni!' });
    return;
  }

  if (ujLakas.terulet <= 0 || ujLakas.ar <= 0 || ujLakas.szoba <= 0) {
    console.error(`ERROR NUM: 400`);
    response.render('fooldal', {
      hiba: 'Hiba: A felszínterület, ár és szobák száma mezőknek kötelező pozitív értéket adni!',
    });
    return;
  }

  if (ujLakas.szoba % 1 !== 0) {
    console.error(`ERROR NUM: 400`);
    response.render('fooldal', {
      hiba: 'Hiba: A szobák számának egész számnak kell lennie!',
    });
    return;
  }

  const uzenet = `A szerver sikeresen megkapta az információkat!:
  Felhasználónév: ${request.body.felhasznaloNev}
  Lakás (város): ${request.body.varos}
  Lakás (negyed): ${request.body.negyed}
  Felszínterület: ${request.body.terulet}
  Ár: ${request.body.ar}
  Szobák száma: ${request.body.szoba}`;
  console.log(uzenet);
  await insertIntoDatabase(ujLakas);
  const talalatok = await executeQuery({});
  response.render('fooldal', { talalatok });
});

app.get('/kereses', async (request, response) => {
  const felhasznaloNev = String(request.query.felhasznaloNev);
  const minAr = Number(request.query.min_ar) || 0;
  const maxAr = Number(request.query.max_ar) || Infinity;
  const minSzoba = Number(request.query.min_szoba) || 0;
  const maxSzoba = Number(request.query.max_szoba) || Infinity;
  const varos = request.query.varos ? request.query.varos.toString().toLowerCase() : '';
  const negyed = request.query.negyed ? request.query.negyed.toString().toLowerCase() : '';
  const talalatok = await executeQuery({
    felhasznaloNev: { $regex: felhasznaloNev, $options: 'i' },
    ar: { $gte: minAr, $lte: maxAr },
    szoba: { $gte: minSzoba, $lte: maxSzoba },
    varos: { $regex: varos, $options: 'i' },
    negyed: { $regex: negyed, $options: 'i' },
  });
  response.render('fooldal', { talalatok });
});

app.get('/reszletes/:id', async (request, response) => {
  const lakasId = sanitize(request.params.id);
  try {
    const lakasArray = await executeQuery({ _id: new ObjectId(lakasId) });
    if (lakasArray.length === 0) {
      console.error(`ERROR NUM: 404`);
      response.render('reszletes', { hiba: 'Hiba: Nem talállható lakás a megadott ID-val!' });
      return;
    }
    const lakas = lakasArray[0];
    response.render('reszletes', { lakas });
  } catch (err) {
    console.error(`ERROR NUM: 500 ${err}`);
    response.render('reszletes', { hiba: 'Hiba: Az oldalt nem sikerült betölteni!' });
  }
});

app.listen(3000, () => {
  console.log('Szerver fut a 3000-es porton');
});

init();
