document.addEventListener("DOMContentLoaded", () => {
  const calendarContainer = document.getElementById("calendar-container");
  const btnAgregarPaciente = document.getElementById("btnAgregarPaciente");
  const modalAgregarPaciente = document.getElementById("modalAgregarPaciente");
  const formAgregarPaciente = document.getElementById("formAgregarPaciente");
  let currentView = "day";
  let currentDate = new Date();

  // ==============================
  // Modal para agregar paciente
  // ==============================

  if (btnAgregarPaciente && modalAgregarPaciente) {
    btnAgregarPaciente.addEventListener("click", () => {
      modalAgregarPaciente.classList.remove("hidden");
    });

    window.addEventListener("click", (e) => {
      if (e.target === modalAgregarPaciente) {
        modalAgregarPaciente.classList.add("hidden");
      }
    });
  }

  if (formAgregarPaciente) {
    formAgregarPaciente.addEventListener("submit", function (e) {
      e.preventDefault();
      const nombre = document.getElementById("nombrePaciente").value.trim();
      const notas = document.getElementById("notasPaciente").value.trim();

      if (!nombre) {
        alert("El nombre es obligatorio.");
        return;
      }

      db.collection("pacientes").add({ nombre, notas }).then(() => {
        alert("Paciente agregado exitosamente.");
        modalAgregarPaciente.classList.add("hidden");
        formAgregarPaciente.reset();
        cargarPacientesEnSelect();
      }).catch((error) => {
        console.error("Error al guardar paciente: ", error);
      });
    });
  }

  // ==============================
  // Calendario
  // ==============================

  function findCell(fecha, hora) {
    const cells = document.querySelectorAll(".calendar-cell");
    for (const cell of cells) {
      if (
        cell.getAttribute("data-fecha") === fecha &&
        cell.getAttribute("data-hora") === hora
      ) {
        return cell;
      }
    }
    return null;
  }

  async function loadAppointments() {
    const snapshot = await db.collection("citas").get();
    const citas = snapshot.docs.map(doc => doc.data());
    citas.forEach(cita => {
      const cell = findCell(cita.fecha, cita.hora);
      if (cell) {
        const div = document.createElement("div");
        div.className = "appointment";
        div.innerHTML = `
          <strong>${cita.nombre}</strong><br>
          ${cita.doctora}<br>
          ${cita.notas ? cita.notas : ""}
        `;
        cell.appendChild(div);
        cell.classList.add("ocupado");
      }
    });
  }

  function renderCalendar() {
    calendarContainer.innerHTML = "";
    if (currentView === "day") renderDayView();
    else if (currentView === "week") renderWeekView();
    else if (currentView === "month") renderMonthView();
    loadAppointments();
  }

  function renderDayView() {
    const table = document.createElement("table");
    for (let hour = 8; hour <= 20; hour++) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      const dateStr = currentDate.toISOString().split("T")[0];
      cell.className = "calendar-cell";
      cell.textContent = `${hour}:00`;
      cell.setAttribute("data-fecha", dateStr);
      cell.setAttribute("data-hora", `${hour.toString().padStart(2, "0")}:00`);
      cell.onclick = () => openModal(dateStr, `${hour.toString().padStart(2, "0")}:00`);
      row.appendChild(cell);
      table.appendChild(row);
    }
    calendarContainer.appendChild(table);
  }

  function renderWeekView() {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(currentDate);
      day.setDate(currentDate.getDate() - currentDate.getDay() + i);
      const th = document.createElement("th");
      th.textContent = day.toDateString().slice(0, 10);
      headerRow.appendChild(th);
      days.push(day);
    }
    table.appendChild(headerRow);

    for (let hour = 8; hour <= 20; hour++) {
      const row = document.createElement("tr");
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        const day = days[i];
        const dateStr = day.toISOString().split("T")[0];
        const timeStr = `${hour.toString().padStart(2, "0")}:00`;
        cell.className = "calendar-cell";
        cell.setAttribute("data-fecha", dateStr);
        cell.setAttribute("data-hora", timeStr);
        cell.onclick = () => openModal(dateStr, timeStr);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    calendarContainer.appendChild(table);
  }

  function renderMonthView() {
    const table = document.createElement("table");
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let day = 1;

    for (let week = 0; week < 6; week++) {
      const row = document.createElement("tr");
      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("td");
        if (week === 0 && i < firstDay) {
          cell.textContent = "";
        } else if (day <= daysInMonth) {
          const dateStr = new Date(year, month, day).toISOString().split("T")[0];
          cell.className = "calendar-cell";
          cell.setAttribute("data-fecha", dateStr);
          cell.setAttribute("data-hora", "08:00");
          cell.textContent = day;
          cell.onclick = () => openModal(dateStr, "08:00");
          day++;
        }
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    calendarContainer.appendChild(table);
  }

  window.changeView = function (view) {
    currentView = view;
    renderCalendar();
  };

  window.openModal = function (fecha, hora) {
    document.getElementById("modal-date").value = fecha;
    document.getElementById("modal-time").value = hora;
    document.getElementById("modal").classList.remove("hidden");
  };

  window.closeModal = function () {
    document.getElementById("modal-form").reset();
    document.getElementById("modal").classList.add("hidden");
  };

  document.getElementById("modal-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("nombre").value;
    const doctora = document.getElementById("modal-doctor").value;
    const fecha = document.getElementById("modal-date").value;
    const hora = document.getElementById("modal-time").value;
    const notas = document.getElementById("modal-notes").value;

    await db.collection("citas").add({
      nombre,
      doctora,
      fecha,
      hora,
      notas,
    });

    closeModal();
    renderCalendar();
  });

  renderCalendar();
  cargarPacientesEnSelect();
});

// ==============================
// Cargar pacientes al <select>
// ==============================

function cargarPacientesEnSelect() {
  const select = document.getElementById("nombre");
  if (!select) return;

  select.innerHTML = `<option value="">Selecciona un paciente</option>`;

  db.collection("pacientes").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const paciente = doc.data();
      const option = document.createElement("option");
      option.value = paciente.nombre;
      option.textContent = paciente.nombre;
      select.appendChild(option);
    });
  });
}

