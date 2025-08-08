const form = document.getElementById('appointment-form');
const calendar = document.getElementById('calendar');
const completedSection = document.getElementById('completed-appointments');
const doctorButtons = document.querySelectorAll('.doctor-toggle');

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

  const doctor = document.getElementById('doctor').value;
  const name = document.getElementById('name').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const notes = document.getElementById('notes').value.trim();

  if (!name || !date || !time) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  const snapshot = await db.collection("appointments").where("date", "==", date).get();

  let conflictFound = false;
  snapshot.forEach(doc => {
    const appt = doc.data();
    const existingTime = new Date(`${appt.date}T${appt.time}`);
    const newTimeObj = new Date(`${date}T${time}`);
    const diffMinutes = Math.abs((newTimeObj - existingTime) / (1000 * 60));

    if (diffMinutes < 60) {
      conflictFound = {
        time: appt.time,
        doctor: appt.doctor,
        patient: appt.name
      };
    }
  });

  if (conflictFound) {
    const customConfirm = document.createElement('div');
    customConfirm.style.position = 'fixed';
    customConfirm.style.top = '0';
    customConfirm.style.left = '0';
    customConfirm.style.width = '100%';
    customConfirm.style.height = '100%';
    customConfirm.style.backgroundColor = 'rgba(0,0,0,0.5)';
    customConfirm.style.display = 'flex';
    customConfirm.style.justifyContent = 'center';
    customConfirm.style.alignItems = 'center';
    customConfirm.style.zIndex = '9999';

    customConfirm.innerHTML = `
      <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 400px; text-align: center; font-family: sans-serif">
        <p style="margin-bottom: 1rem;">⚠️ Ya hay una cita cercana a las <strong>${conflictFound.time}</strong> con la Dra. <strong>${conflictFound.doctor}</strong> (${conflictFound.patient}).</p>
        <p style="margin-bottom: 1.5rem;">¿Qué deseas hacer?</p>
        <button id="change-time" style="background: #ff6f61; color: white; padding: 0.5rem 1rem; border: none; margin-right: 1rem; border-radius: 6px; cursor: pointer;">Cambiar hora</button>
        <button id="continue-anyway" style="background: #4caf50; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;">Continuar</button>
      </div>
    `;

    document.body.appendChild(customConfirm);

    return new Promise(resolve => {
      document.getElementById('change-time').onclick = () => {
        document.body.removeChild(customConfirm);
        resolve(); // No registra la cita
      };
      document.getElementById('continue-anyway').onclick = async () => {
        document.body.removeChild(customConfirm);
        const appointment = { doctor, name, date, time, notes, completed: false };
        await db.collection("appointments").add(appointment);
        notifyOtherDoctor(doctor);
        form.reset();
        resolve();
      };
    });
  } else {
    const appointment = { doctor, name, date, time, notes, completed: false };
    await db.collection("appointments").add(appointment);
    notifyOtherDoctor(doctor);
    form.reset();
  }
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

  appointmentDiv.querySelector('.cancel-btn').addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      await db.collection("appointments").doc(id).delete();
    }
  });

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
  const other = doctor === 'Esquivel' ? 'Janampa' : 'Esquivel';
  alert(`Notificación: Se ha registrado una cita para la Dra. ${doctor}. Informa a la Dra. ${other}.`);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
