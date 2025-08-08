// script.js con Firebase y opción de cancelar citas compartidas

const form = document.getElementById('appointment-form');
const calendar = document.getElementById('calendar');
const completedSection = document.getElementById('completed-appointments');
const doctorButtons = document.querySelectorAll('.doctor-toggle');

// Cargar citas desde Firestore
function loadAppointments() {
  db.collection("appointments").onSnapshot(snapshot => {
    calendar.innerHTML = '';
    completedSection.innerHTML = '';
    snapshot.forEach(doc => {
      const appointment = { id: doc.id, ...doc.data() };
      if (appointment.completed) {
        displayCompletedAppointment(appointment);
      } else {
        displayAppointment(appointment);
      }
    });
  });
}

loadAppointments();

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const doctor = document.getElementById('doctor').value; // 'Esquivel' o 'Janampa'
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

  const appointment = { doctor, name, date, time, notes, completed: false };
  await db.collection("appointments").add(appointment);
  notifyOtherDoctor(doctor);
  form.reset();
});

function displayAppointment({ id, doctor, name, date, time, notes }) {
  const appointmentDiv = document.createElement('div');
  appointmentDiv.classList.add('appointment', `doctor-${doctor}`);

  appointmentDiv.innerHTML = `
    <strong>Dra. ${doctor}</strong><br>
    <span><strong>Paciente:</strong> ${name}</span><br>
    <span><strong>Fecha:</strong> ${date}</span><br>
    <span><strong>Hora:</strong> ${time}</span><br>
    <span><strong>Notas:</strong> ${notes || 'Sin notas'}</span><br>
    <label><input type="checkbox" class="mark-complete"> Marcar como realizada</label><br>
    <button class="cancel-btn">Cancelar</button>
  `;

  // Cancelar cita
  appointmentDiv.querySelector('.cancel-btn').addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      await db.collection("appointments").doc(id).delete();
    }
  });

  // Marcar como realizada
  appointmentDiv.querySelector('.mark-complete').addEventListener('change', async (e) => {
    if (e.target.checked) {
      await db.collection("appointments").doc(id).update({ completed: true });
      showToast("✔ Cita marcada como realizada");
    }
  });

  calendar.appendChild(appointmentDiv);
}

function displayCompletedAppointment({ id, doctor, name, date, time, notes }) {
  const completedDiv = document.createElement('div');
  completedDiv.classList.add('appointment', 'completed', `doctor-${doctor}`);

  completedDiv.innerHTML = `
    <strong>Dra. ${doctor}</strong><br>
    <span><strong>Paciente:</strong> <s>${name}</s></span><br>
    <span><strong>Fecha:</strong> <s>${date}</s></span><br>
    <span><strong>Hora:</strong> <s>${time}</s></span><br>
    <span><strong>Notas:</strong> <s>${notes || 'Sin notas'}</s></span><br>
    <button class="cancel-btn">Eliminar</button>
  `;

  completedDiv.querySelector('.cancel-btn').addEventListener('click', async () => {
    if (confirm('¿Deseas eliminar esta cita realizada?')) {
      await db.collection("appointments").doc(id).delete();
    }
  });

  completedSection.appendChild(completedDiv);
}

// Filtrar citas por doctora
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

// Notificar a otra doctora
function notifyOtherDoctor(doctor) {
  const other = doctor === 'Esquivel' ? 'Janampa' : 'Esquivel';
  alert(`Notificación: Se ha registrado una cita para la Dra. ${doctor}. Informa a la Dra. ${other}.`);
}

// Mostrar mensaje de éxito
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
