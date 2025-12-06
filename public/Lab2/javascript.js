// kapcsolodunk a html elemeiez
const button = document.getElementById('gomb');
const form = document.getElementById('form');
const canvas = document.getElementById('rajzolo');
const context = canvas.getContext('2d');

// general egy random szint
function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

// a pixeles canvast helyrepofozza
function resizeCanvas() {
  // nagyon csunya es pixeles enelkul, azert kellett
  const parent = canvas.parentElement;
  const dpr = devicePixelRatio;
  const rect = parent.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Ellenorizzuk, hogy a form jol van-e kitoltve
function formEllenorzes() {
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  let checkedCb = 0;
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      checkedCb++;
    }
  });
  if (checkedCb === 0 || !form.reportValidity()) {
    alert(
      'HIBÁS KITÖLTES!!!\nElvárások:\nNe hagyd üresen a Név mezőt!\nVálassz legalább egy műveletet!\nA feladatok száma legyen 5-10 közt!',
    );
    return false;
  }
  return true;
}

resizeCanvas();
let feladatok = [];
let eredmenyek = [];
let balTeglalapSzin = [];
let jobbTeglalapSzin = [];
let vonalak = [];
let balTeglalap = [];
let jobbTeglalap = [];
let jatekAktiv = false;
let eredmeny = 0;

function feladatokGeneralasa() {
  const fsz = Number(document.getElementById('feladatszam').value);
  const cbElemek = form.querySelectorAll('input[type="checkbox"]');
  const muveletek = [];
  if (cbElemek[0].checked) {
    muveletek.push('+');
  }
  if (cbElemek[1].checked) {
    muveletek.push('-');
  }
  if (cbElemek[2].checked) {
    muveletek.push('*');
  }
  if (cbElemek[3].checked) {
    muveletek.push('/');
  }

  for (let i = 0; i < fsz; i++) {
    const op1 = Math.floor(Math.random() * 101);
    let op2 = Math.floor(Math.random() * 101);
    const op = muveletek[Math.floor(Math.random() * muveletek.length)];
    if (op === '+') eredmeny = op1 + op2;
    else if (op === '-') eredmeny = op1 - op2;
    else if (op === '*') eredmeny = op1 * op2;
    else {
      op2 = op2 === 0 ? 1 : op2; // hogy ne lehessen 0-val osztani
      eredmeny = Math.floor(op1 / op2);
    }
    feladatok.push(`${op1} ${op} ${op2}`);
    eredmenyek.push(eredmeny);

    balTeglalapSzin.push({ color: randomColor() });
    jobbTeglalapSzin.push({ color: randomColor() });
  }
  eredmenyek.sort(() => Math.random() - 0.5);
}

function kirajzolas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  const magassag = 50;
  const lepes = 80;

  for (let i = 0; i < feladatok.length; i++) {
    const szin = balTeglalapSzin[i].color;
    context.fillStyle = szin;
    context.fillRect(100, magassag + i * lepes, 200, 60);
    context.fillStyle = 'black';
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(feladatok[i], 200, magassag + i * lepes + 30);
    balTeglalap.push({ x: 100, y: magassag + i * lepes, szelesseg: 200, magassag: 60, index: i, szin });
  }

  for (let i = 0; i < eredmenyek.length; i++) {
    const szin = jobbTeglalapSzin[i].color;
    context.fillStyle = szin;
    context.fillRect(500, magassag + i * lepes, 200, 60);
    context.fillStyle = 'black';
    context.fillText(eredmenyek[i], 600, magassag + i * lepes + 30);
    jobbTeglalap.push({ x: 500, y: magassag + i * lepes, szelesseg: 200, magassag: 60, index: i, szin });
  }

  vonalak.forEach((v) => {
    context.strokeStyle = 'blue';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(v.x1, v.y1);
    context.lineTo(v.x2, v.y2);
    context.stroke();
  });
}

function kiszamol(feladat) {
  const komponensek = feladat.split(' ');
  const operandus1 = Number(komponensek[0]);
  const operator = komponensek[1];
  let operandus2 = Number(komponensek[2]);
  if (operator === '+') return operandus1 + operandus2;
  if (operator === '-') return operandus1 - operandus2;
  if (operator === '*') return operandus1 * operandus2;
  operandus2 = operandus2 === 0 ? 1 : operandus2; // hogy ne lehessen 0-val osztani
  return Math.floor(operandus1 / operandus2);
}

function valaszokEllenorzese() {
  for (let i = 0; i < vonalak.length; i++) {
    const helyes = kiszamol(feladatok[vonalak[i].balIndex]) === eredmenyek[vonalak[i].jobbIndex];
    if (helyes) context.strokeStyle = 'green';
    else context.strokeStyle = 'red';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(vonalak[i].x1, vonalak[i].y1);
    context.lineTo(vonalak[i].x2, vonalak[i].y2);
    context.stroke();
  }
}

let kivalasztottBal = -1;
function balClick(x, y) {
  for (let i = 0; i < balTeglalap.length; i++) {
    const teglalap = balTeglalap[i];
    if (
      x > balTeglalap[i].x &&
      x < balTeglalap[i].x + balTeglalap[i].szelesseg &&
      y > balTeglalap[i].y &&
      y < balTeglalap[i].y + balTeglalap[i].magassag
    ) {
      // for ciklus nelkul is tudjuk ellenorizni, hogy benne van-e,
      // a some fuggveny segitsegevel
      const marVanVonal = vonalak.some((v) => v.balIndex === teglalap.index);
      if (marVanVonal) {
        alert('Ehhez a feladathoz már húztál eredményt!');
        kivalasztottBal = -1;
        kirajzolas();
        return true;
      }
      kivalasztottBal = i;
      kirajzolas();
      context.strokeStyle = 'red';
      context.lineWidth = 4;
      context.strokeRect(balTeglalap[i].x, balTeglalap[i].y, balTeglalap[i].szelesseg, balTeglalap[i].magassag);
      return true;
    }
  }
  return false;
}

function jobbClick(x, y) {
  for (let i = 0; i < jobbTeglalap.length; i++) {
    const teglalap = jobbTeglalap[i];
    if (
      x > jobbTeglalap[i].x &&
      x < jobbTeglalap[i].x + jobbTeglalap[i].szelesseg &&
      y > jobbTeglalap[i].y &&
      y < jobbTeglalap[i].y + jobbTeglalap[i].magassag
    ) {
      const marVanVonal = vonalak.some((v) => v.jobbIndex === teglalap.index);
      if (marVanVonal) {
        alert('Ezt az eredményt már hozzárendelted egy feladathoz!');
        kivalasztottBal = -1;
        kirajzolas();
        return true;
      }
      vonalak.push({
        x1: balTeglalap[kivalasztottBal].x + balTeglalap[kivalasztottBal].szelesseg,
        y1: balTeglalap[kivalasztottBal].y + balTeglalap[kivalasztottBal].magassag / 2,
        x2: jobbTeglalap[i].x,
        y2: jobbTeglalap[i].y + jobbTeglalap[i].magassag / 2,
        balIndex: balTeglalap[kivalasztottBal].index,
        jobbIndex: jobbTeglalap[i].index,
      });

      kivalasztottBal = -1;
      kirajzolas();
      if (vonalak.length === feladatok.length) valaszokEllenorzese();
      return true;
    }
  }
  return false;
}

function reset() {
  feladatok = [];
  eredmenyek = [];
  balTeglalapSzin = [];
  jobbTeglalapSzin = [];
  vonalak = [];
  balTeglalap = [];
  jobbTeglalap = [];
  kivalasztottBal = -1;
  form.querySelectorAll('input').forEach((i) => (i.readOnly = false));
  form.querySelectorAll('input[type="checkbox"]').forEach((i) => (i.disabled = false));
  context.clearRect(0, 0, canvas.width, canvas.height);
  jatekAktiv = false;
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (balClick(x, y)) return;
  jobbClick(x, y);
});

button.addEventListener('click', () => {
  if (!jatekAktiv) {
    if (!formEllenorzes()) return;
    form.querySelectorAll('input').forEach((i) => (i.readOnly = true));
    form.querySelectorAll('input[type="checkbox"]').forEach((i) => (i.disabled = true));
    feladatokGeneralasa();
    kirajzolas();
    jatekAktiv = true;
  } else {
    reset();
  }
});
