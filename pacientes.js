// Inicialización
const patientsContainer = document.getElementById("patients-container");
const modal = document.getElementById("modal");
const modalAgregar = document.getElementById("modalAgregarPaciente");
const formEditarNotas = document.getElementById("edit-notes-form");
const textareaNotas = document.getElementById("edit-notes-text");
const formAgregar = document.getElementById("formAgregarPaciente");
const btnAgregar = document.getElementById("btnAgregarPaciente");

let pacienteIdActual = null;

// Mostrar pacientes
function mostrarPacientes() {
  if (!patientsContainer) return;

  patientsContainer.innerHTML = "<p>Cargando pacientes...</p>";

  db.collection("pacientes").get().then((querySnapshot) => {
    patientsContainer.innerHTML = "";

    if (querySnapshot.empty) {
      patientsContainer.innerHTML = "<p>No hay pacientes registrados.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const paciente = doc.data();
      const pacienteId = doc.id;

      const div = document.createElement("div");
      div.className = "paciente-card";

      div.innerHTML = `
        <h2>${paciente.nombre}</h2>
        <p><strong>Notas:</strong> ${paciente.notas || "Sin notas"}</p>
        <button class="btn edit-notes" data-id="${pacienteId}" data-notas="${paciente.notas || ""}">Editar notas</button>
        <div class="citas-container" id="citas-${pacienteId}">
          <p>Cargando citas...</p>
        </div>
      `;

      patientsContainer.appendChild(div);

      cargarCitasPaciente(paciente.nombre, `citas-${pacienteId}`);
    });
  });
}

// Cargar citas por paciente (usando el campo name en "appointments")
function cargarCitasPaciente(nombrePaciente, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  db.collection("appointments")
    .where("name", "==", nombrePaciente)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        contenedor.innerHTML = "<p>No hay citas para este paciente.</p>";
        return;
      }

      const realizadas = [];
      const canceladas = [];
      const reprogramadas = [];

      querySnapshot.forEach((doc) => {
        const cita = doc.data();
        const estado = cita.status || (cita.completed ? "realizada" : "pendiente");

        const detalle = `<li>${cita.date} a las ${cita.time} con Dra. ${cita.doctor} — Notas: ${cita.notes || "Sin notas"}</li>`;

        if (estado === "realizada" || estado === true) {
          realizadas.push(detalle);
        } else if (estado === "cancelada") {
          canceladas.push(detalle);
        } else if (estado === "reprogramada") {
          reprogramadas.push(detalle);
        }
      });

      contenedor.innerHTML = `
        <h4>Citas realizadas</h4>
        <ul>${realizadas.join("") || "<li>No hay</li>"}</ul>
        <h4>Citas canceladas</h4>
        <ul>${canceladas.join("") || "<li>No hay</li>"}</ul>
        <h4>Citas reprogramadas</h4>
        <ul>${reprogramadas.join("") || "<li>No hay</li>"}</ul>
      `;
    });
}

// Evento para abrir modal de edición de notas
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("edit-notes")) {
    pacienteIdActual = e.target.dataset.id;
    textareaNotas.value = e.target.dataset.notas || "";
    modal.classList.remove("hidden");
    modal.classList.add("show");
  }
});

// Guardar cambios de notas
if (formEditarNotas) {
  formEditarNotas.addEventListener("submit", (e) => {
    e.preventDefault();
    const nuevasNotas = textareaNotas.value;

    db.collection("pacientes").doc(pacienteIdActual).update({
      notas: nuevasNotas,
    }).then(() => {
      modal.classList.remove("show");
      modal.classList.add("hidden");
      mostrarPacientes();
    });
  });
}

// Mostrar modal para agregar paciente
if (btnAgregar) {
  btnAgregar.addEventListener("click", () => {
    modalAgregar.classList.remove("hidden");
    modalAgregar.classList.add("show");
  });
}

// Guardar nuevo paciente
if (formAgregar) {
  formAgregar.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombrePaciente").value.trim();
    const notas = document.getElementById("notasPaciente").value.trim();

    if (!nombre) return alert("Nombre requerido.");

    db.collection("pacientes").add({ nombre, notas }).then(() => {
      modalAgregar.classList.remove("show");
      modalAgregar.classList.add("hidden");
      formAgregar.reset();
      mostrarPacientes();
    });
  });
}

// Cerrar modal al hacer clic fuera
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }
  if (e.target === modalAgregar) {
    modalAgregar.classList.remove("show");
    modalAgregar.classList.add("hidden");
  }
});

// Iniciar si existe el contenedor
if (patientsContainer) {
  mostrarPacientes();
}
