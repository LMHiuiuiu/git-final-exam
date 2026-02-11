# Ứng dụng quản lý đặt sân cầu lông (phiên bản hoàn thiện cho đồ án 2)

## Tính năng đã hoàn thiện
- Tạo / sửa / xóa lịch đặt sân.
- Kiểm tra trùng lịch theo `sân + ngày + khung giờ`.
- Quản lý trạng thái lịch: `Chờ xác nhận`, `Đã xác nhận`, `Hoàn tất`, `Đã hủy`.
- Tính tổng tiền theo công thức:
  - `Tổng tiền = (Số giờ thuê × Giá sân/giờ) + Phụ thu dịch vụ`.
- Lọc dữ liệu theo từ khóa, trạng thái, ngày.
- Thống kê nhanh: tổng lịch, lịch hôm nay, số lịch hoàn tất, doanh thu hoàn tất.
- Xuất/nhập dữ liệu JSON để sao lưu hoặc chuyển máy.
- Lưu dữ liệu cục bộ qua `localStorage`.

## Cách chạy
1. Mở trực tiếp `app/index.html` bằng trình duyệt.
2. Hoặc chạy static server:

```bash
python3 -m http.server 4173
```

Truy cập: `http://localhost:4173/app/`

## Gợi ý nâng cấp backend (nếu cần nộp full-stack)
- Tách API riêng (Node.js/Express hoặc ASP.NET Web API).
- Lưu lịch vào MySQL/PostgreSQL thay cho `localStorage`.
- Thêm phân quyền người dùng (Admin/Nhân viên).
- Bổ sung module hóa đơn PDF + thống kê theo khoảng thời gian.
