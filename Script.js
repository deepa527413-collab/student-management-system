// Base URL of the Django REST API. Change this if your backend runs
// on a different host/port.
const API_BASE = 'http://127.0.0.1:8000/api/students/';

// ---- DOM references ----
const form = document.getElementById('student-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formMessage = document.getElementById('form-message');

const idField = document.getElementById('student-id');
const rollField = document.getElementById('roll_number');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const phoneField = document.getElementById('phone');
const departmentField = document.getElementById('department');
const yearField = document.getElementById('year');

const searchBox = document.getElementById('search-box');
const filterDepartment = document.getElementById('filter-department');
const refreshBtn = document.getElementById('refresh-btn');
const statusMessage = document.getElementById('status-message');
const tbody = document.getElementById('students-tbody');

let searchDebounceTimer = null;

// ---- Client-side validation ----
function clearErrors() {
  document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-row input').forEach(el => el.classList.remove('invalid'));
}

function showFieldError(fieldId, message) {
  const errEl = document.getElementById('err-' + fieldId);
  const inputEl = document.getElementById(fieldId);
  if (errEl) errEl.textContent = message;
  if (inputEl) inputEl.classList.add('invalid');
}

function validateForm() {
  clearErrors();
  let valid = true;

  if (!rollField.value.trim()) {
    showFieldError('roll_number', 'Roll number is required.');
    valid = false;
  }

  if (!nameField.value.trim() || nameField.value.trim().length < 2) {
    showFieldError('name', 'Name must be at least 2 characters.');
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailField.value.trim())) {
    showFieldError('email', 'Enter a valid email address.');
    valid = false;
  }

  if (phoneField.value.trim() && !/^\+?\d{7,15}$/.test(phoneField.value.trim())) {
    showFieldError('phone', 'Phone must be 7-15 digits, optional leading +.');
    valid = false;
  }

  const yearVal = Number(yearField.value);
  if (!yearVal || yearVal < 1 || yearVal > 6) {
    showFieldError('year', 'Year must be between 1 and 6.');
    valid = false;
  }

  return valid;
}

function setFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = 'form-message' + (type ? ' ' + type : '');
}

function setStatusMessage(text, type) {
  statusMessage.textContent = text;
  statusMessage.className = 'status-message' + (type ? ' ' + type : '');
}

function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add New Student';
  submitBtn.textContent = 'Add Student';
  cancelBtn.style.display = 'none';
  clearErrors();
  setFormMessage('', '');
}

cancelBtn.addEventListener('click', resetForm);

// ---- API calls ----
async function apiRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Is the Django backend running on ' + API_BASE + '?');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (_) {
    // No JSON body (e.g. some 204 responses) — that's fine.
  }

  if (!response.ok) {
    const err = new Error('Request failed');
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
}

function buildListUrl() {
  const params = new URLSearchParams();
  if (searchBox.value.trim()) params.set('search', searchBox.value.trim());
  if (filterDepartment.value) params.set('department', filterDepartment.value);
  const qs = params.toString();
  return API_BASE + (qs ? '?' + qs : '');
}

async function loadStudents() {
  setStatusMessage('Loading students...', '');
  try {
    const data = await apiRequest(buildListUrl());
    const students = Array.isArray(data) ? data : (data.results || []);
    renderStudents(students);
    setStatusMessage(
      students.length + (students.length === 1 ? ' student found.' : ' students found.'),
      ''
    );
  } catch (err) {
    setStatusMessage(err.message || 'Failed to load students.', 'error');
    renderStudents([]);
  }
}

function renderStudents(students) {
  tbody.innerHTML = '';

  if (!students.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = '<td colspan="7">No students found. Add one above, or adjust your search.</td>';
    tbody.appendChild(tr);
    return;
  }

  for (const s of students) {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td class="roll-cell">${escapeHtml(s.roll_number)}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.email)}</td>
      <td>${escapeHtml(s.phone || '—')}</td>
      <td>${escapeHtml(s.department)}</td>
      <td>${escapeHtml(String(s.year))}</td>
      <td class="actions-cell">
        <button class="btn btn-edit" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="btn btn-danger" data-action="delete" data-id="${s.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---- Create / Update ----
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    setFormMessage('Please fix the highlighted fields.', 'error');
    return;
  }

  const payload = {
    roll_number: rollField.value.trim(),
    name: nameField.value.trim(),
    email: emailField.value.trim(),
    phone: phoneField.value.trim(),
    department: departmentField.value,
    year: Number(yearField.value),
  };

  const editingId = idField.value;
  const url = editingId ? `${API_BASE}${editingId}/` : API_BASE;
  const method = editingId ? 'PUT' : 'POST';

  submitBtn.disabled = true;
  try {
    await apiRequest(url, { method, body: JSON.stringify(payload) });
    setFormMessage(editingId ? 'Student updated successfully.' : 'Student added successfully.', 'success');
    resetForm();
    loadStudents();
  } catch (err) {
    if (err.data && err.data.errors) {
      applyServerErrors(err.data.errors);
      setFormMessage('Please fix the highlighted fields.', 'error');
    } else {
      setFormMessage(err.message || 'Something went wrong. Please try again.', 'error');
    }
  } finally {
    submitBtn.disabled = false;
  }
});

function applyServerErrors(errors) {
  for (const [field, messages] of Object.entries(errors)) {
    const message = Array.isArray(messages) ? messages[0] : String(messages);
    showFieldError(field, message);
  }
}

// ---- Edit / Delete (event delegation) ----
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === 'edit') {
    await startEdit(id);
  } else if (btn.dataset.action === 'delete') {
    await deleteStudent(id, btn);
  }
});

async function startEdit(id) {
  try {
    const student = await apiRequest(`${API_BASE}${id}/`);
    idField.value = student.id;
    rollField.value = student.roll_number;
    nameField.value = student.name;
    emailField.value = student.email;
    phoneField.value = student.phone || '';
    departmentField.value = student.department;
    yearField.value = student.year;

    formTitle.textContent = 'Edit Student';
    submitBtn.textContent = 'Save Changes';
    cancelBtn.style.display = 'inline-block';
    clearErrors();
    setFormMessage('', '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    setStatusMessage(err.message || 'Could not load that student.', 'error');
  }
}

async function deleteStudent(id, btn) {
  const row = btn.closest('tr');
  const name = row ? row.children[1].textContent : 'this student';
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

  btn.disabled = true;
  try {
    await apiRequest(`${API_BASE}${id}/`, { method: 'DELETE' });
    setStatusMessage('Student deleted.', '');
    if (idField.value === id) resetForm();
    loadStudents();
  } catch (err) {
    setStatusMessage(err.message || 'Failed to delete student.', 'error');
    btn.disabled = false;
  }
}

// ---- Search / filter ----
searchBox.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(loadStudents, 350);
});
filterDepartment.addEventListener('change', loadStudents);
refreshBtn.addEventListener('click', loadStudents);

// ---- Init ----
loadStudents();
              
