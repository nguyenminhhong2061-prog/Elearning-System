-- =====================================================================
-- Module C (Kiểm tra) — gán ngày mở, ngày đóng cho hai đề tổng hợp mẫu
-- (200 và 201). Trang soạn đề (docs/api/admin.md, kịch bản 24 nhánh 5a)
-- cần đề nào cũng có ngày; hai đề này trước đây để trống ("luôn mở").
-- =====================================================================

-- Cả hai mở trọn tháng 10/2026 theo giờ Việt Nam, cùng quy ước với đề
-- tạo từ trang soạn đề: từ 00:00 ngày mở đến 23:59:59 ngày đóng.
-- Chỉ gán cho đề còn trống cả hai ngày, để không ghi đè ngày đã đặt.
UPDATE tests
SET start_date = TIMESTAMPTZ '2026-10-01 00:00:00+07',
    end_date   = TIMESTAMPTZ '2026-10-31 23:59:59+07'
WHERE id IN (200, 201)
  AND start_date IS NULL
  AND end_date IS NULL;
