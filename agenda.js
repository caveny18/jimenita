const calendarContainer = document.getElementById("calendar-container");
const modal = document.getElementById("modal");
const modalForm = document.getElementById("modal-form");
const modalDate = document.getElementById("modal-date");
const modalName = document.getElementById("modal-name");
const modalDoctor = document.getElementById("modal-doctor");
const modalTime = document.getElementById("modal-time");
const modalNotes = document.getElementById("modal-notes");

let currentView = "week";
let currentDate = new Date();

function changeView(view) {
  currentView = view;
  renderCalendar();
}

function renderCalendar() {
  calendarContainer.innerHTML = "";
  if (currentView === "day") renderDayView();
  else if (currentView === "week") renderWeekView();
  else if (currentView === "month") renderMonthView();
}

function renderWeekView() {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const table = document.createElement("table");
  table.className = "calendar-table";

  const headerRow = table.insertRow();
  const timeColumn = headerRow.insertCell();
  timeColumn.innerHTML = "Hora";

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const cell = headerRow.insertCell();
    cell.textContent = day.toDateString().split(" ").slice(0, 3).join(" ");
  }

  for (let hour = 7; hour <= 18; hour++) {
    const row = table.insertRow();
    const hourCell = row.insertCell();
    hourCell.textContent = `${hour}:00`;

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const cell = row.insertCell();
      cell.className = "calendar-cell";
      cell.dataset.fecha = day.toISOString().split("T")[0];
      cell.dataset.hora = `${hour.toString().padStart(2, "0")}:00`;
      cell.onclick = () => openModal(day, hour);
    }
  }

  calendarContainer.appendChild(table);
  loadAppointments();
}

function renderDayView() {
  const table = document.createElement("table");
  table.className = "calendar-table";

  const headerRow = table.insertRow();
  const timeHeader = headerRow.insertCell();
  timeHeader.innerHTML = "Hora";
  const dayHeader = headerRow.insertCell();
  dayHeader.innerHTML = currentDate.toDateString();

  for (let hour = 7; hour <= 18; hour++) {
    const row = table.insertRow();
    const hourCell = row.insertCell();
    hourCell.textContent = `${hour}:00`;

    const cell = row.insertCell();
    cell.className = "calendar-cell";
    cell.dataset.fecha = currentDate.toISOString().split("T")[0];
    cell.dataset.hora = `${hour.toString().padStart(2, "0")}:00`;
    cell.onclick = () => openModal(currentDate, hour);
  }

  calendarContainer.appendChild(table);
  loadAppointments();
}

function renderMonthView() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const table = document.createElement("table");
  table.className = "calendar-table";

  const headerRow = table.insertRow();
  ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].forEach(d => {
    const cell = headerRow.insertCell();
    cell.textContent = d;
  });

  let current = new Date(startDate);
  while (current <= lastDay || current.getDay() !== 0) {
    const row = table.insertRow();
    for (let i = 0; i < 7; i++) {
      const cell = row.insertCell();
      cell.className = "calendar-cell";
      cell.textContent = current.getDate();
      cell.dataset.fecha = current.toISOString().split("T")[0];
      cell.dataset.hora = `08:00`; // default hour
      cell.onclick = () => openModal(current, 8);
      if (current.getMonth() !== month) {
        cell.style.opacity = "0.3";
      }
      current.setDate(current.getDate() + 1);
    }
  }

  calendarContainer.appendChild(table);
  loadAppointments();
}

function openModal(date, hour) {
  modal.classList.remove("hidden");
  modalDate.value = date.toISOString().split("T")[0];
  modalTime.value = `${hour.toString().padStart(2, "0")}:00`;
  modalName.value = "";
  modalNotes.value = "";
  modalDoctor.value = "Esquivel";
}

function closeModal() {
  modal.classList.add("hidden");
}

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newCita = {
    fecha: modalDate.value,
    hora: modalTime.value,
    nombre: modalName.value.trim(),
    notas: modalNotes.value.trim(),
    doctora: modalDoctor.value,
    realizada: false
  };

  try {
    await db.collection("citas").add(newCita);
    closeModal();
    renderCalendar(); // recarga la vista
  } catch (error) {
    alert("Error al guardar la cita");
    console.error(error);
  }
});

async function loadAppointments() {
  const snapshot = await db.collection("citas").get();
  snapshot.forEach(doc => {
    const data = doc.data();
    const fecha = data.fecha;
    const hora = data.hora;

    const selector = `.calendar-cell[data-fecha="${fecha}"][data-hora="${hora}"]`;
    const cell = document.querySelector(selector);
    if (cell) {
      cell.innerHTML = `<strong>${data.nombre}</strong><br>${data.doctora}`;
      cell.classList.add("busy-cell");
    }
  });
}

window.onload = () => {
  renderCalendar();
};
