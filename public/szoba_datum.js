document.addEventListener('DOMContentLoaded', () => {
  const talalatok = document.querySelectorAll('.talalat');

  const showError = (t, uzenet) => {
    let hibaElem = t.querySelector('.hiba');
    if (!hibaElem) {
      hibaElem = document.createElement('div');
      hibaElem.className = 'hiba';
      t.appendChild(hibaElem);
    }
    hibaElem.textContent = uzenet;
    hibaElem.style.display = 'block';
  };

  talalatok.forEach((t) => {
    t.addEventListener('click', async () => {
      const hirdetesID = t.id;

      try {
        const szoba = t.querySelector('.szobaSzam');
        const datum = t.querySelector('.datum');

        // ha mar latszik akkor tunjon el es nem fetchelunk
        if (szoba.style.display === 'block') {
          szoba.style.display = 'none';
          datum.style.display = 'none';
          return;
        }
        const valasz = await fetch(`/szoba_datum?hirdetesID=${hirdetesID}`);
        const adatok = await valasz.json();

        szoba.querySelector('.ertek').textContent = adatok.szoba;
        szoba.style.display = 'block';

        datum.querySelector('.ertek').textContent = new Date(adatok.datum).toLocaleDateString('hu-HU');
        datum.style.display = 'block';
      } catch {
        showError(t, 'Hiba történt a további adatok megjelenítése során!');
      }
    });
  });
});
