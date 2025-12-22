import { checkUploadsDir } from './img_handling.js';
import { connectToDatabase } from './dal.js';

export async function init() {
  try {
    await connectToDatabase();
    await checkUploadsDir();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
