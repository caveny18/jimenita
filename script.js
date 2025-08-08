// script.js con Firebase y opción de cancelar citas compartidas

// Inicializar Firebase (esto ya debe estar en el HTML antes de este script)
const db = firebase.firestore();

const form = document.getElementById('appointment-form');
const calendar = document.getElementById('calendar');
const doctorButtons = document.querySelectorAll('.doctor-toggle');

// Cargar citas desde Firestore
function loadAppointments() {
  db.collection("appointments").onSnapshot(snapshot => {
    calendar.innerHTML = '';
    snapshot.forEach(doc => {
      const appointment = { id: doc.id, ...doc.data() };
      displayAppointment(appointment);
    });
  });
}

loadAppointments();

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const doctor = document.getElementById('doctor').value;
  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const notes = document.getElementById('notes').value.trim();

  if (!name || !date || !time) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  const existing = await db.collection("appointments")
    .where("date", "==", date)
    .where("time", "==", time)
    .get();

  if (!existing.empty) {
    alert('Ya hay una cita registrada para esta fecha y hora.');
    return;
  }

  const appointment = { doctor, name, date, time, notes };
  await db.collection("appointments").add(appointment);
  notifyOtherDoctor(doctor);
  form.reset();
});

function displayAppointment({ id, doctor, name, date, time, notes }) {
  const appointmentDiv = document.createElement('div');
  appointmentDiv.classList.add('appointment');
  appointmentDiv.classList.add(doctor === 'A' ? 'doctor-a' : 'doctor-b');
  appointmentDiv.innerHTML = `
    <strong>${doctor === 'A' ? 'Dra. A' : 'Dra. B'}</strong><br>
    <span><strong>Paciente:</strong> ${name}</span><br>
    <span><strong>Fecha:</strong> ${date}</span><br>
    <span><strong>Hora:</strong> ${time}</span><br>
    <span><strong>Notas:</strong> ${notes || 'Sin notas'}</span><br>
    <button class="cancel-btn">Cancelar</button>
  `;

  // Agregar botón de cancelar
  appointmentDiv.querySelector('.cancel-btn').addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      await db.collection("appointments").doc(id).delete();
    }
  });

  calendar.appendChild(appointmentDiv);
}

doctorButtons.forEach(button => {
  button.addEventListener('click', function () {
    const selectedDoctor = this.dataset.doctor;
    document.querySelectorAll('.appointment').forEach(app => {
      if (selectedDoctor === 'all') {
        app.style.display = 'block';
      } else {
        app.style.display = app.classList.contains(`doctor-${selectedDoctor}`) ? 'block' : 'none';
      }
    });
  });
});

function notifyOtherDoctor(doctor) {
  const other = doctor === 'A' ? 'B' : 'A';
  alert(`Notificación: Se ha registrado una cita para la Dra. ${doctor}. Informa a la Dra. ${other}.`);
}
