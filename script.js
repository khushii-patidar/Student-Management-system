/* ============================================
   EduDesk — Student Management logic
   (data kept in-memory; add localStorage yourself
   if you want it to persist across page reloads)
   ============================================ */

let students = [
  { id: 1, name: "Ravi Sharma", email: "ravi.sharma@example.com", dept: "Computer Science", score: 88, status: "active" },
  { id: 2, name: "Ananya Iyer", email: "ananya.iyer@example.com", dept: "Electronics", score: 76, status: "active" },
  { id: 3, name: "Karan Mehta", email: "karan.mehta@example.com", dept: "Mechanical", score: 54, status: "inactive" },
  { id: 4, name: "Priya Nair", email: "priya.nair@example.com", dept: "Business Admin", score: 91, status: "active" },
  { id: 5, name: "Aditya Verma", email: "aditya.verma@example.com", dept: "Computer Science", score: 67, status: "active" },
  { id: 6, name: "Sneha Kulkarni", email: "sneha.k@example.com", dept: "Civil", score: 82, status: "inactive" },
];

let nextId = students.length + 1;
let currentFilter = "all";
let currentDept = "all";
let searchQuery = "";
let deleteTargetId = null;

const AVATAR_COLORS = ["#1f4d3d", "#b6892d", "#2f6690", "#8a4a3c", "#5c4b8a", "#3d7a63"];

// ---- DOM refs ----
const tableBody = document.getElementById("tableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const deptFilter = document.getElementById("deptFilter");
const filterTabs = document.getElementById("filterTabs");

const addStudentBtn = document.getElementById("addStudentBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const cancelBtn = document.getElementById("cancelBtn");
const studentForm = document.getElementById("studentForm");

const studentIdInput = document.getElementById("studentId");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const departmentInput = document.getElementById("department");
const scoreInput = document.getElementById("score");
const statusInput = document.getElementById("status");

const deleteOverlay = document.getElementById("deleteOverlay");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const toast = document.getElementById("toast");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDepts = document.getElementById("statDepts");
const statAvg = document.getElementById("statAvg");

// ---- Init ----
populateDeptFilter();
render();

// ---- Event listeners ----
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.trim().toLowerCase();
  render();
});

deptFilter.addEventListener("change", (e) => {
  currentDept = e.target.value;
  render();
});

filterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  [...filterTabs.children].forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  currentFilter = tab.dataset.filter;
  render();
});

addStudentBtn.addEventListener("click", () => openModal());
modalClose.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

studentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveStudent();
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);
deleteOverlay.addEventListener("click", (e) => {
  if (e.target === deleteOverlay) closeDeleteModal();
});
confirmDeleteBtn.addEventListener("click", () => {
  students = students.filter((s) => s.id !== deleteTargetId);
  closeDeleteModal();
  populateDeptFilter();
  render();
  showToast("Student deleted");
});

// ---- Rendering ----
function render() {
  const filtered = getFilteredStudents();
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    filtered.forEach((s) => tableBody.appendChild(buildRow(s)));
  }

  updateStats();
}

function getFilteredStudents() {
  return students.filter((s) => {
    const matchesStatus = currentFilter === "all" || s.status === currentFilter;
    const matchesDept = currentDept === "all" || s.dept === currentDept;
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery);
    return matchesStatus && matchesDept && matchesSearch;
  });
}

function buildRow(s) {
  const tr = document.createElement("tr");
  const initials = s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const color = AVATAR_COLORS[s.id % AVATAR_COLORS.length];

  tr.innerHTML = `
    <td>
      <div class="student-cell">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="student-name-wrap">
          <span class="student-name">${escapeHtml(s.name)}</span>
          <span class="student-email">${escapeHtml(s.email)}</span>
        </div>
      </div>
    </td>
    <td><span class="dept-badge">${escapeHtml(s.dept)}</span></td>
    <td>
      <div class="score-cell">
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${s.score}%"></div></div>
        <span class="score-num">${s.score}%</span>
      </div>
    </td>
    <td>
      <span class="status-badge ${s.status}">
        <span class="status-dot"></span>${s.status === "active" ? "Active" : "Inactive"}
      </span>
    </td>
    <td>
      <div class="row-actions">
        <button class="icon-btn edit-btn" title="Edit" data-id="${s.id}">✎</button>
        <button class="icon-btn danger delete-btn" title="Delete" data-id="${s.id}">🗑</button>
      </div>
    </td>
  `;

  tr.querySelector(".edit-btn").addEventListener("click", () => openModal(s.id));
  tr.querySelector(".delete-btn").addEventListener("click", () => openDeleteModal(s.id));

  return tr;
}

function updateStats() {
  const total = students.length;
  const active = students.filter((s) => s.status === "active").length;
  const depts = new Set(students.map((s) => s.dept)).size;
  const avg = total ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / total) : 0;

  statTotal.textContent = total;
  statActive.textContent = active;
  statDepts.textContent = depts;
  statAvg.textContent = `${avg}%`;
}

function populateDeptFilter() {
  const depts = [...new Set(students.map((s) => s.dept))].sort();
  const currentValue = deptFilter.value || "all";
  deptFilter.innerHTML = `<option value="all">All Departments</option>`;
  depts.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    deptFilter.appendChild(opt);
  });
  deptFilter.value = depts.includes(currentValue) ? currentValue : "all";
}

// ---- Modal (Add/Edit) ----
function openModal(id = null) {
  studentForm.reset();
  if (id) {
    const s = students.find((st) => st.id === id);
    modalTitle.textContent = "Edit Student";
    studentIdInput.value = s.id;
    fullNameInput.value = s.name;
    emailInput.value = s.email;
    departmentInput.value = s.dept;
    scoreInput.value = s.score;
    statusInput.value = s.status;
  } else {
    modalTitle.textContent = "Add Student";
    studentIdInput.value = "";
  }
  modalOverlay.classList.remove("hidden");
  fullNameInput.focus();
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

function saveStudent() {
  const id = studentIdInput.value ? Number(studentIdInput.value) : null;
  const data = {
    name: fullNameInput.value.trim(),
    email: emailInput.value.trim(),
    dept: departmentInput.value,
    score: Math.max(0, Math.min(100, Number(scoreInput.value))),
    status: statusInput.value,
  };

  if (id) {
    const idx = students.findIndex((s) => s.id === id);
    students[idx] = { ...students[idx], ...data };
    showToast("Student updated");
  } else {
    students.push({ id: nextId++, ...data });
    showToast("Student added");
  }

  populateDeptFilter();
  closeModal();
  render();
}

// ---- Delete modal ----
function openDeleteModal(id) {
  deleteTargetId = id;
  deleteOverlay.classList.remove("hidden");
}
function closeDeleteModal() {
  deleteOverlay.classList.add("hidden");
  deleteTargetId = null;
}

// ---- Toast ----
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

// ---- Utils ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
