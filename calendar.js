import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPqcugo5r3PmW38sMvL1OIQMj5kayUeSU",
  authDomain: "agendaconsultorio-d6324.firebaseapp.com",
  projectId: "agendaconsultorio-d6324",
  storageBucket: "agendaconsultorio-d6324.firebasestorage.app",
  messagingSenderId: "1064951207006",
  appId: "1:1064951207006:web:32e4cd86e60ace92fe10cf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let vistaActual = 'semana';

window.cambiarVista = function (vista) {
  vistaActual = vista;
  cargarCitas();
};

function agruparCitasPorFecha(citas) {
  const agrupadas = {};
  citas.forEach(cita => {
    if (!agrupadas[cita.date]) agrupadas[cita.date] = [];
    agrupadas[cita.date].push(cita);
  });
  return agrupadas;
}

function renderizarCalendario(citas) {
  const container = document.getElementById('calendar-container');
  container.innerHTML = '';

  const citasAgrupadas = agruparCitasPorFecha(citas);
  const fechas = Object.keys(citasAgrupadas).sort();

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];

  fechas.forEach(fecha => {
    if (vistaActual === 'dia' && fecha !== hoyStr) return;

    const columna = document.createElement('div');
    columna.className = 'day-column';

    const titulo = document.createElement('h2');
    titulo.textContent = fecha;
    columna.appendChild(titulo);

    citasAgrupadas[fecha].forEach(cita => {
      const item = document.createElement('div');
      item.className = 'cita-item';

      // colores por doctora
      if (cita.doctor === 'Esquivel') item.classList.add('esquivel');
      if (cita.doctor === 'Janampa') item.classList.add('janampa');

      // estados visuales
      if (cita.estado === 'realizada') item.classList.add('realizada');
      if (cita.estado === 'cancelada') item.classList.add('cancelada');
      if (cita.estado === 'reprogramada') item.classList.add('reprogramada');

      item.innerHTML = `
        <strong>${cita.name}</strong><br>
        ${cita.time} — <em>${cita.doctor}</em><br>
        <small>${cita.notes || ''}</small><br>
        ${cita.estado && cita.estado !== "pendiente" ? `<span>(${cita.estado})</span>` : ""}
      `;
      columna.appendChild(item);
    });

    container.appendChild(columna);
  });
}

async function cargarCitas() {
  const filtro = document.getElementById('filtroDoctora').value;
  const snapshot = await getDocs(collection(db, 'appointments'));
  const citas = snapshot.docs.map(doc => doc.data());

  const filtradas = filtro === 'todas'
    ? citas
    : citas.filter(cita => cita.doctor === filtro);

  renderizarCalendario(filtradas);
}

cargarCitas();
