import { MongoClient } from 'mongodb';

let client = null;
let db = null;
global.db = null;
function dbValue() {
  if (db) {
    return db;
  }
  return null;
}

export async function connectToDatabase() {
  if (dbValue() !== null) {
    return dbValue();
  }
  const connectionString = 'mongodb+srv://felhasznalo_rw:felhasznalo@web.rg1jtnl.mongodb.net/';
  client = new MongoClient(connectionString, {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
  });
  try {
    await client.connect();
    console.log('Sikeres csatlakozás az adatbázishoz!');
    db = client.db('ingatlanAdatok');
    return db;
  } catch (err) {
    throw new Error(`Hiba az adatbázishoz való csatlakozás során: ${err.message}`);
  }
}

export async function insertIntoDatabase(lakas) {
  try {
    const dbLocal = await connectToDatabase();
    const collection = dbLocal.collection('hirdetesek');
    await collection.insertOne(lakas);
  } catch (err) {
    throw new Error(`Hiba az adat beszúrása során: ${err.message}`);
  }
}

export async function executeQuery(query) {
  try {
    const dbLocal = await connectToDatabase();
    const collection = dbLocal.collection('hirdetesek');
    const results = await collection.find(query).toArray();
    return results;
  } catch (err) {
    throw new Error(`Hiba a lekérdezés végrehajtása során: ${err.message}`);
  }
}

export async function getUsers() {
  const dbLocal = await connectToDatabase();
  const collection = dbLocal.collection('felhasznalok');
  return await collection.find({}).toArray();
}

export async function updateDatabase(query, updateData) {
  try {
    const dbLocal = await connectToDatabase();
    const collection = dbLocal.collection('hirdetesek');
    await collection.updateOne(query, { $set: updateData });
  } catch (err) {
    throw new Error(`Hiba a frissítés során: ${err.message}`);
  }
}

process.on('SIGINT', async () => {
  console.log('Az adadbázis kapcsolat leállítása folyamatban...');
  if (client) {
    await client.close();
    console.log('Kapcsolat bontva. Alkalmazás leállítása.');
  }
  process.exit(0);
});
