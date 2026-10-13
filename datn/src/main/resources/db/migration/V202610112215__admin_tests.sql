-- =====================================================================
-- Module C (Kiểm tra) — quản trị đề kiểm tra (docs/api/admin.md, kịch
-- bản 24): trạng thái đề, hướng dẫn làm bài, nội dung của đề, đề gốc
-- của bản nhân bản và thứ tự câu hỏi do admin sắp.
-- =====================================================================

-- Trạng thái đề: DRAFT (nháp, người học chưa thấy), VISIBLE (hiện với
-- người học trong khoảng ngày mở–đóng), HIDDEN (admin đã ẩn).
-- Mặc định VISIBLE: đề đã có và đề chèn bằng SQL (dữ liệu mẫu) vẫn hiện
-- với người học như trước. Đề tạo từ trang soạn đề luôn ghi rõ trạng
-- thái, mặc định là DRAFT (do service quyết định, không phải cột này).
ALTER TABLE tests
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE'
    CHECK (status IN ('DRAFT','VISIBLE','HIDDEN'));

-- skill_text: nội dung của đề do admin gõ ("Từ vựng và ngữ pháp"). Cột
-- skill có sẵn lưu một kỹ năng dạng enum nên không dùng cho chữ tự do.
-- instruction: hướng dẫn làm bài do admin gõ.
-- duplicated_from_id: đề gốc khi đề được tạo bằng "Nhân bản".
ALTER TABLE tests
  ADD COLUMN skill_text         VARCHAR(200) NULL,
  ADD COLUMN instruction        TEXT NULL,
  ADD COLUMN duplicated_from_id BIGINT NULL REFERENCES tests(id) ON DELETE SET NULL;
CREATE INDEX idx_tests_duplicated_from ON tests(duplicated_from_id);

-- Thứ tự câu hỏi trong đề theo trang soạn đề. Các câu đã có đều là 0
-- nên vẫn xếp theo id như trước.
ALTER TABLE test_questions ADD COLUMN sort_order INT NOT NULL DEFAULT 0;
