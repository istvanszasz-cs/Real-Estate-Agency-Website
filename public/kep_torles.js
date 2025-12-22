document.addEventListener('DOMContentLoaded', () => {
  const gomb = document.querySelector('#kepTorloGomb');
  const hirdetesID = document.querySelector('#hirdetesID').value;
  const visszajelzes = document.querySelector('#visszajelzes');
  const kep = document.querySelector('#lakasImg');
  gomb.addEventListener('click', async () => {
    try {
      const eredmeny = await fetch(`/kepTorles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hirdetesID }),
      });
      const adat = await eredmeny.json();
      kep.src = '../uploads/no-image.png';
      visszajelzes.textContent = adat.valasz;
    } catch (err) {
      console.log(err);
      visszajelzes.textContent = 'Hiba történt a feldolgozáskor!';
    }
  });
});
