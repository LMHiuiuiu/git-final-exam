const STORAGE_KEY = "badmintonBookingsV2";

const form = document.getElementById("booking-form");
const tbody = document.getElementById("booking-body");
const rowTemplate = document.getElementById("row-template");

const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const filterDate = document.getElementById("filterDate");

const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");
const resetBtn = document.getElementById("reset-btn");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");

const stats = {
  total: document.getElementById("stat-total"),
  today: document.getElementById("stat-today"),
  completed: document.getElementById("stat-completed"),
  revenue: document.getElementById("stat-revenue"),
};

const fields = {
  editingId: document.getElementById("editingId"),
  customerName: document.getElementById("customerName"),
  phone: document.getElementById("phone"),
  court: document.getElementById("court"),
  date: document.getElementById("date"),
  startTime: document.getElementById("startTime"),
  endTime: document.getElementById("endTime"),
  status: document.getElementById("status"),
  hourlyRate: document.getElementById("hourlyRate"),
  serviceFee: document.getElementById("serviceFee"),
  note: document.getElementById("note"),
};

const STATUS_LABEL = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function calcDurationHours(startTime, endTime) {
  return Math.max(0, (toMinutes(endTime) - toMinutes(startTime)) / 60);
}

function calcTotal(booking) {
  const duration = calcDurationHours(booking.startTime, booking.endTime);
  return Math.round(duration * booking.hourlyRate + booking.serviceFee);
}

function normalizeBooking(raw) {
  return {
    ...raw,
    hourlyRate: Number(raw.hourlyRate) || 0,
    serviceFee: Number(raw.serviceFee) || 0,
    status: raw.status || "pending",
    note: raw.note || "",
  };
}

function loadBookings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeBooking) : [];
  } catch {
    return [];
  }
}

function saveBookings(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function overlaps(a, b) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function validateBooking(booking, existingBookings) {
  if (booking.startTime >= booking.endTime) {
    return "Giờ kết thúc phải lớn hơn giờ bắt đầu.";
  }

  if (!booking.customerName || !booking.phone || !booking.court || !booking.date) {
    return "Vui lòng nhập đầy đủ thông tin bắt buộc.";
  }

  if (!/^\d{9,11}$/.test(booking.phone)) {
    return "Số điện thoại phải gồm 9-11 chữ số.";
  }

  const conflict = existingBookings.find((item) => {
    if (item.id === booking.id) return false;
    return item.court === booking.court && item.date === booking.date && overlaps(item, booking);
  });

  if (conflict) {
    return `Sân ${booking.court} đã có lịch trong khung giờ này.`;
  }

  return "";
}

function formatTimeRange(booking) {
  return `${booking.date} | ${booking.startTime} - ${booking.endTime}`;
}

function getBookingFromForm() {
  const editingId = fields.editingId.value;

  return {
    id: editingId || crypto.randomUUID(),
    customerName: fields.customerName.value.trim(),
    phone: fields.phone.value.trim(),
    court: fields.court.value,
    date: fields.date.value,
    startTime: fields.startTime.value,
    endTime: fields.endTime.value,
    status: fields.status.value,
    hourlyRate: Number(fields.hourlyRate.value) || 0,
    serviceFee: Number(fields.serviceFee.value) || 0,
    note: fields.note.value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function getFilterState() {
  return {
    keyword: searchInput.value.trim().toLowerCase(),
    status: filterStatus.value,
    date: filterDate.value,
  };
}

function getVisibleBookings(items) {
  const filter = getFilterState();
  return items.filter((item) => {
    const content = `${item.customerName} ${item.phone} ${item.court}`.toLowerCase();
    const matchKeyword = !filter.keyword || content.includes(filter.keyword);
    const matchStatus = !filter.status || item.status === filter.status;
    const matchDate = !filter.date || item.date === filter.date;
    return matchKeyword && matchStatus && matchDate;
  });
}

function renderStats(items) {
  const today = new Date().toISOString().slice(0, 10);
  const completed = items.filter((item) => item.status === "completed");
  const revenue = completed.reduce((sum, item) => sum + calcTotal(item), 0);

  stats.total.textContent = String(items.length);
  stats.today.textContent = String(items.filter((item) => item.date === today).length);
  stats.completed.textContent = String(completed.length);
  stats.revenue.textContent = formatCurrency(revenue);
}

function render(items) {
  tbody.innerHTML = "";
  const visible = getVisibleBookings(items);

  visible
    .slice()
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .forEach((item) => {
      const fragment = rowTemplate.content.cloneNode(true);
      const row = fragment.querySelector("tr");

      fragment.querySelector('[data-field="customer"]').textContent = item.customerName;
      fragment.querySelector('[data-field="court"]').textContent = item.court;
      fragment.querySelector('[data-field="time"]').textContent = formatTimeRange(item);
      fragment.querySelector('[data-field="status"]').innerHTML = `<span class="badge ${item.status}">${
        STATUS_LABEL[item.status]
      }</span>`;
      fragment.querySelector('[data-field="total"]').textContent = formatCurrency(calcTotal(item));
      fragment.querySelector('[data-field="phone"]').textContent = item.phone;
      fragment.querySelector('[data-field="note"]').textContent = item.note || "-";

      row.dataset.id = item.id;
      tbody.appendChild(fragment);
    });

  if (!visible.length) {
    const empty = document.createElement("tr");
    empty.innerHTML = '<td colspan="8" class="empty">Không có lịch đặt phù hợp bộ lọc.</td>';
    tbody.appendChild(empty);
  }

  renderStats(items);
}

function resetForm() {
  form.reset();
  fields.editingId.value = "";
  fields.hourlyRate.value = "120000";
  fields.serviceFee.value = "0";
  fields.status.value = "pending";
  formTitle.textContent = "Tạo lịch đặt mới";
  saveBtn.textContent = "Thêm lịch đặt";
}

function fillFormForEdit(booking) {
  fields.editingId.value = booking.id;
  fields.customerName.value = booking.customerName;
  fields.phone.value = booking.phone;
  fields.court.value = booking.court;
  fields.date.value = booking.date;
  fields.startTime.value = booking.startTime;
  fields.endTime.value = booking.endTime;
  fields.status.value = booking.status;
  fields.hourlyRate.value = String(booking.hourlyRate);
  fields.serviceFee.value = String(booking.serviceFee);
  fields.note.value = booking.note || "";

  formTitle.textContent = "Chỉnh sửa lịch đặt";
  saveBtn.textContent = "Cập nhật lịch";
}

function exportBookings(items) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `badminton-bookings-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importBookingsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(parsed)) throw new Error("invalid");
      bookings = parsed.map(normalizeBooking);
      saveBookings(bookings);
      render(bookings);
      resetForm();
      alert("Nhập dữ liệu thành công.");
    } catch {
      alert("File JSON không hợp lệ.");
    }
  };
  reader.readAsText(file);
}

let bookings = loadBookings();
render(bookings);
resetForm();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const booking = getBookingFromForm();
  const message = validateBooking(booking, bookings);

  if (message) {
    alert(message);
    return;
  }

  const index = bookings.findIndex((item) => item.id === booking.id);
  if (index === -1) {
    bookings.push(booking);
  } else {
    bookings[index] = booking;
  }

  saveBookings(bookings);
  render(bookings);
  resetForm();
});

tbody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const row = target.closest("tr");
  if (!row?.dataset.id) return;

  const booking = bookings.find((item) => item.id === row.dataset.id);
  if (!booking) return;

  if (target.dataset.action === "edit") {
    fillFormForEdit(booking);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (target.dataset.action === "delete") {
    const accepted = confirm(`Xóa lịch của ${booking.customerName} (${booking.court})?`);
    if (!accepted) return;
    bookings = bookings.filter((item) => item.id !== booking.id);
    saveBookings(bookings);
    render(bookings);
    resetForm();
  }
});

[searchInput, filterStatus, filterDate].forEach((element) => {
  element.addEventListener("input", () => render(bookings));
});

resetBtn.addEventListener("click", resetForm);

exportBtn.addEventListener("click", () => exportBookings(bookings));

importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (file) {
    importBookingsFromFile(file);
  }
  importFile.value = "";
});
