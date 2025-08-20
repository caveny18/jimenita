import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, query, orderBy, onSnapshot, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración de Firebase
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

// Elementos del DOM
const form = document.getElementById('appointment-form');
const listaCitas = document.getElementById('appointments-list');
const historialCitas = document.getElementById('citas-historico');

// Modal reprogramar
const modal = document.getElementById('modal-reprogramar');
const formReprogramar = document.getElementById('form-reprogramar');
const idReprogramarInput = document.getElementById('reprogramar-id');
const fechaReprogramarInput = document.getElementById('reprogramar-fecha');
const horaReprogramarInput = document.getElementById('reprogramar-hora');
document.getElementById('cerrar-modal').onclick = () => modal.classList.add('hidden');

// Estilos por doctora
const colorPorDoctora = {
  Esquivel: 'esquivel',
  Janampa: 'janampa'
};

// Mostrar citas
function mostrarCita(docData, id) {
  const card = document.createElement('div');
  card.classList.add('appointment-card');
  card.classList.add(colorPorDoctora[docData.doctor] || 'sin-color');

  const estado = docData.estado || (docData.completed ? 'realizada' : 'pendiente');
  const nombre = docData.name || 'Sin nombre';
  const doctora = docData.doctor || 'Desconocida';
  const fecha = docData.date || 'Sin fecha';
  const hora = docData.time || 'Sin hora';
  const notas = docData.notes || '';

  if (estado !== "pendiente") card.classList.add('cancelled');

  card.innerHTML = `
    <strong>${nombre}</strong> — ${doctora}<br>
    ${fecha} a las ${hora}<br>
    <em>${notas}</em>
    <div class="btn-group">
      ${estado === "pendiente" ? `
        <button onclick="marcarEstado('${id}', 'realizada')">✔ Realizada</button>
        <button onclick="marcarEstado('${id}', 'cancelada')">✖ Cancelada</button>
        <button onclick="marcarEstado('${id}', 'reprogramada')">↺ Reprogramar</button>
      ` : `
        <span>(${estado})</span>
        <button onclick="marcarEstado('${id}', 'pendiente')">↺ Reestablecer</button>
      `}
    </div>
  `;

  if (estado === "pendiente") {
    listaCitas.appendChild(card);
  } else {
    historialCitas.appendChild(card);
  }
}

// Marcar estado o abrir modal
window.marcarEstado = async function (id, estado) {
  if (estado === 'reprogramada') {
    idReprogramarInput.value = id;
    fechaReprogramarInput.value = '';
    horaReprogramarInput.value = '';
    modal.classList.remove('hidden');
    return;
  }

  const ref = doc(db, 'appointments', id);
  await updateDoc(ref, {
    estado: estado,
    completed: estado === 'realizada'
  });
  alert("Cita actualizada.");
};

// Escuchar cambios en citas
function escucharCitas() {
  const citasRef = collection(db, "appointments");
  const q = query(citasRef, orderBy("date", "desc"));

  onSnapshot(q, (snapshot) => {
    listaCitas.innerHTML = "";
    historialCitas.innerHTML = "";

    snapshot.forEach(doc => {
      mostrarCita(doc.data(), doc.id);
    });
  });
}
escucharCitas();

// Enviar nueva cita
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const doctora = document.getElementById('doctora').value;
  const nombre = document.getElementById('nombre').value;
  const telefono = document.getElementById('telefono').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const notas = document.getElementById('notas').value;

  const conflicto = await existeConflicto(fecha, hora);
  if (conflicto) {
    alert("Conflicto de horario. Hay una cita en ese rango de media hora.");
    return;
  }

  await addDoc(collection(db, "appointments"), {
    doctor: doctora,
    name: nombre,
    telefono,
    date: fecha,
    time: hora,
    notes: notas,
    estado: "pendiente",
    completed: false
  });

  form.reset();
});

// Verifica conflictos de horario
async function existeConflicto(fecha, hora) {
  const q = query(collection(db, "appointments"));
  const snapshot = await getDocs(q);
  const nuevaHora = new Date(`2000-01-01T${hora}`);

  for (const docu of snapshot.docs) {
    const cita = docu.data();
    if (cita.date === fecha && (cita.estado || !cita.completed)) {
      const horaCita = new Date(`2000-01-01T${cita.time}`);
      const diff = Math.abs(horaCita - nuevaHora) / (1000 * 60);
      if (diff < 30) return true;
    }
  }
  return false;
}

// Guardar reprogramación
formReprogramar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = idReprogramarInput.value;
  const nuevaFecha = fechaReprogramarInput.value;
  const nuevaHora = horaReprogramarInput.value;

  const ref = doc(db, 'appointments', id);
  await updateDoc(ref, {
    date: nuevaFecha,
    time: nuevaHora,
    estado: 'pendiente',
    completed: false
  });

  modal.classList.add('hidden');
  alert("Cita reprogramada.");
});
