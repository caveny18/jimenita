// agenda.js — Mostrar citas agrupadas por día y hora, con bloqueo cruzado y citas realizadas

const calendarContainer = document.getElementById('calendar-container');

// Función para cargar y mostrar citas organizadas
function loadAppointments() {
  db.collection("appointments").orderBy("date").orderBy("time")
    .onSnapshot(snapshot => {
      const appointmentsByDay = {};
      snapshot.forEach(doc => {
        const appointment = { id: doc.id, ...doc.data() };
        if (!appointmentsByDay[appointment.date]) {
          appointmentsByDay[appointment.date] = [];
        }
        appointmentsByDay[appointment.date].push(appointment);
      });
      displayGroupedAppointments(appointmentsByDay);
    });
}

function displayGroupedAppointments(grouped) {
  calendarContainer.innerHTML = '';

  for (const date in grouped) {
    const daySection = document.createElement('section');
    daySection.className = 'day-section';
    daySection.innerHTML = `<h2>${date}</h2>`;

    grouped[date].forEach(appointment => {
      const appointmentDiv = document.createElement('div');
      appointmentDiv.classList.add('appointment');
      appointmentDiv.classList.add(appointment.doctor === 'A' ? 'doctor-a' : 'doctor-b');
      if (appointment.done) appointmentDiv.classList.add('marked-done');

      appointmentDiv.innerHTML = `
        <strong>${appointment.doctor === 'A' ? 'Dra. A' : 'Dra. B'}</strong><br>
        <span><strong>Paciente:</strong> ${appointment.name}</span><br>
        <span><strong>Hora:</strong> ${appointment.time}</span><br>
        <span><strong>Notas:</strong> ${appointment.notes || 'Sin notas'}</span><br>
        ${!appointment.done ? '<button class="done-btn">Marcar como realizada</button>' : ''}
      `;

      if (!appointment.done) {
        appointmentDiv.querySelector('.done-btn').addEventListener('click', async () => {
          await db.collection("appointments").doc(appointment.id).update({ done: true });
        });
      }

      daySection.appendChild(appointmentDiv);
    });

    calendarContainer.appendChild(daySection);
  }
}

loadAppointments();
