const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:4000/api"
    : "https://practicas14.onrender.com/api";

const $ = (id) => document.getElementById(id);

const elements = {
  apiStatus: $("apiStatus"),
  tokenBox: $("tokenBox"),
  sessionLabel: $("sessionLabel"),
  resultado: $("resultado"),
  toast: $("toast"),
  userCount: $("userCount"),
  usersContainer: $("usersContainer"),
  logoutButton: $("logoutButton"),
  refreshUsersButton: $("refreshUsersButton"),
  googleLoginButton: $("googleLoginButton"),
  deleteUserButton: $("deleteUserButton"),
};

function mostrarResultado(data, mensaje) {
  const payload = mensaje ? { mensaje, ...data } : data;
  elements.resultado.textContent = JSON.stringify(payload, null, 2);
}

function mensajeRegistros(total, prefix) {
  const label = total === 1 ? "registro" : "registros";
  return `${prefix}: ${total} ${label} encontrado${total === 1 ? "" : "s"}`;
}

function showToast(message, type = "info") {
  elements.toast.textContent = message;
  elements.toast.className = `toast is-visible ${type === "error" ? "is-error" : ""} ${
    type === "success" ? "is-success" : ""
  }`;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.className = "toast";
  }, 3200);
}

function maskToken(token) {
  if (!token) return "Sin token guardado";
  if (token.length <= 24) return token;
  return `${token.slice(0, 14)}...${token.slice(-12)}`;
}

function updateSessionUi() {
  const hasToken = Boolean(state.token);
  elements.tokenBox.textContent = maskToken(state.token);
  elements.sessionLabel.textContent = hasToken ? "Sesion activa" : "Sesion no iniciada";
  elements.logoutButton.disabled = !hasToken;
  elements.refreshUsersButton.disabled = !hasToken;
  elements.deleteUserButton.disabled = !hasToken;
}

function guardarToken(token) {
  state.token = token;
  localStorage.setItem("token", token);
  updateSessionUi();
}

function cerrarSesion() {
  state.token = "";
  state.usuarios = [];
  localStorage.removeItem("token");
  updateSessionUi();
  renderUsuarios([]);
  mostrarResultado({ mensaje: "Sesion cerrada" });
  showToast("Sesion cerrada");
}

function setApiStatus(status, label) {
  elements.apiStatus.className = `status-pill ${status}`;
  elements.apiStatus.querySelector("span:last-child").textContent = label;
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { mensaje: await response.text() };

  if (!response.ok) {
    const message = data.mensaje || "No se pudo completar la solicitud";
    throw Object.assign(new Error(message), { data, status: response.status });
  }

  return data;
}

function requireToken() {
  if (state.token) return true;
  showToast("Primero inicia sesion para usar el CRUD", "error");
  mostrarResultado({ mensaje: "No hay token JWT activo" });
  return false;
}

function getFormData(ids) {
  return ids.reduce((payload, id) => {
    const value = $(id).value.trim();
    if (value) payload[id] = value;
    return payload;
  }, {});
}

function normalizeUser(usuario) {
  return {
    id: usuario._id || usuario.id || "",
    nombre: usuario.nombre || "",
    email: usuario.email || "",
    rol: usuario.rol || "usuario",
    createdAt: usuario.createdAt || "",
  };
}

function renderUsuarios(usuarios) {
  state.usuarios = usuarios.map(normalizeUser);
  elements.userCount.textContent = `${state.usuarios.length} registro${
    state.usuarios.length === 1 ? "" : "s"
  }`;

  if (!state.usuarios.length) {
    elements.usersContainer.className = "empty-state";
    elements.usersContainer.textContent = state.token
      ? "No hay usuarios para mostrar con esos filtros."
      : "Inicia sesion y carga la lista de usuarios.";
    return;
  }

  elements.usersContainer.className = "table-wrap";
  elements.usersContainer.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Creado</th>
          <th>Accion</th>
        </tr>
      </thead>
      <tbody>
        ${state.usuarios
          .map(
            (usuario) => `
              <tr>
                <td>${escapeHtml(usuario.nombre)}</td>
                <td>${escapeHtml(usuario.email)}</td>
                <td><span class="role-badge">${escapeHtml(usuario.rol)}</span></td>
                <td>${formatDate(usuario.createdAt)}</td>
                <td>
                  <button class="button-secondary" type="button" data-edit-id="${escapeHtml(
                    usuario.id
                  )}">Editar</button>
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;

  elements.usersContainer.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => cargarUsuarioEnFormulario(button.dataset.editId));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function cargarUsuarioEnFormulario(id) {
  const usuario = state.usuarios.find((item) => item.id === id);
  if (!usuario) return;

  $("editarId").value = usuario.id;
  $("editarNombre").value = usuario.nombre;
  $("editarEmail").value = usuario.email;
  $("editarRol").value = usuario.rol;
  showToast("Usuario cargado para editar");
}

async function registrar(event) {
  event.preventDefault();
  const payload = {
    nombre: $("regNombre").value.trim(),
    email: $("regEmail").value.trim(),
    password: $("regPassword").value,
  };

  await runAction(async () => {
    const data = await apiRequest("/auth/registro", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    mostrarResultado(data, `Cuenta creada correctamente para ${data.nombre || payload.nombre}`);
    if (data.token) guardarToken(data.token);
    $("registerForm").reset();
    await listarUsuarios(false, { updateResult: false });
    showToast("Cuenta creada correctamente", "success");
  });
}

async function login(event) {
  event.preventDefault();
  const payload = {
    email: $("loginEmail").value.trim(),
    password: $("loginPassword").value,
  };

  await runAction(async () => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    mostrarResultado(data, `Sesion iniciada correctamente. Bienvenido ${data.nombre || data.email}`);
    if (data.token) guardarToken(data.token);
    $("loginForm").reset();
    await listarUsuarios(false, { updateResult: false });
    showToast("Sesion iniciada", "success");
  });
}

function loginGoogle() {
  window.location.href = `${API_URL}/auth/google`;
}

async function crearUsuario(event) {
  event.preventDefault();
  if (!requireToken()) return;

  const payload = {
    nombre: $("crearNombre").value.trim(),
    email: $("crearEmail").value.trim(),
    password: $("crearPassword").value,
    rol: $("crearRol").value,
  };

  await runAction(async () => {
    const data = await apiRequest("/usuarios", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    mostrarResultado(data, `Usuario creado correctamente: ${data.nombre || payload.nombre}`);
    $("createUserForm").reset();
    await listarUsuarios(false, { updateResult: false });
    showToast("Usuario creado", "success");
  });
}

async function listarUsuarios(showSuccess = true, options = {}) {
  if (!requireToken()) return;
  const { updateResult = true } = options;

  const params = new URLSearchParams();
  const nombre = $("filtroNombre").value.trim();
  const email = $("filtroEmail").value.trim();
  if (nombre) params.set("nombre", nombre);
  if (email) params.set("email", email);

  await runAction(async () => {
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/usuarios${query}`);
    const usuarios = data.usuarios || [];
    const total = typeof data.total === "number" ? data.total : usuarios.length;
    const message = mensajeRegistros(
      total,
      query ? "Consulta realizada con filtros" : "Consulta realizada"
    );

    if (updateResult) mostrarResultado(data, message);
    renderUsuarios(usuarios);
    if (showSuccess) showToast(message, "success");
  });
}

async function actualizarUsuario(event) {
  event.preventDefault();
  if (!requireToken()) return;

  const id = $("editarId").value.trim();
  const formData = getFormData(["editarNombre", "editarEmail", "editarRol"]);
  const payload = {
    ...(formData.editarNombre ? { nombre: formData.editarNombre } : {}),
    ...(formData.editarEmail ? { email: formData.editarEmail } : {}),
    ...(formData.editarRol ? { rol: formData.editarRol } : {}),
  };

  if (!Object.keys(payload).length) {
    showToast("Agrega al menos un dato para actualizar", "error");
    return;
  }

  await runAction(async () => {
    const data = await apiRequest(`/usuarios/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    mostrarResultado(data, `Usuario actualizado correctamente: ${data.nombre || id}`);
    await listarUsuarios(false, { updateResult: false });
    showToast("Usuario actualizado", "success");
  });
}

async function eliminarUsuario() {
  if (!requireToken()) return;

  const id = $("editarId").value.trim();
  if (!id) {
    showToast("Ingresa el ID del usuario a eliminar", "error");
    return;
  }

  const confirmed = window.confirm("Quieres eliminar este usuario?");
  if (!confirmed) return;

  await runAction(async () => {
    const data = await apiRequest(`/usuarios/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    mostrarResultado(data, data.mensaje || "Usuario eliminado correctamente");
    $("editUserForm").reset();
    await listarUsuarios(false, { updateResult: false });
    showToast("Usuario eliminado", "success");
  });
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    const data = error.data || { mensaje: error.message };
    mostrarResultado(data);
    showToast(data.mensaje || "Ocurrio un error", "error");
  }
}

async function checkApiHealth() {
  try {
    const data = await apiRequest("/health", { headers: {} });
    const dbLabel = data.database === "connected" ? "MongoDB conectado" : "MongoDB revisando";
    setApiStatus("is-online", `API en linea - ${dbLabel}`);
  } catch (error) {
    setApiStatus("is-error", "API sin conexion");
  }
}

function setupTabs() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-tab-target]").forEach((tab) => {
        tab.classList.toggle("is-active", tab === button);
      });
      document.querySelectorAll(".auth-form").forEach((form) => {
        form.classList.toggle("is-active", form.id === button.dataset.tabTarget);
      });
    });
  });
}

function setupOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return;

  guardarToken(token);
  mostrarResultado({ mensaje: "Login con Google exitoso", token: maskToken(token) });
  window.history.replaceState({}, document.title, window.location.pathname);
  showToast("Sesion iniciada con Google", "success");
}

function bindEvents() {
  $("registerForm").addEventListener("submit", registrar);
  $("loginForm").addEventListener("submit", login);
  $("createUserForm").addEventListener("submit", crearUsuario);
  $("editUserForm").addEventListener("submit", actualizarUsuario);
  $("filterUsersButton").addEventListener("click", () => listarUsuarios());
  elements.refreshUsersButton.addEventListener("click", () => listarUsuarios());
  elements.googleLoginButton.addEventListener("click", loginGoogle);
  elements.logoutButton.addEventListener("click", cerrarSesion);
  elements.deleteUserButton.addEventListener("click", eliminarUsuario);
}

setupTabs();
bindEvents();
setupOAuthToken();
updateSessionUi();
renderUsuarios([]);
checkApiHealth();

if (state.token) {
  listarUsuarios(false);
}
