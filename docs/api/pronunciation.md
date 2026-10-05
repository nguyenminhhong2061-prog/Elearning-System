# OpenPronounce (module B3: phát âm)

DATN dùng [OpenPronounce](https://github.com/Halleck45/OpenPronounce) như một dịch vụ Python riêng. Spring Boot vẫn nhận và kiểm tra WAV, xác minh người dùng/lượt làm bài, gửi audio cùng câu mẫu qua mạng nội bộ và lưu kết quả. Không cần API key chấm điểm.

## Chạy local

1. Cài và mở Docker Desktop.
2. Tại thư mục gốc dự án, chạy:

   ```powershell
   docker compose -f compose.openpronounce.yml up --build -d
   ```

3. Kiểm tra dịch vụ:

   ```powershell
   Invoke-RestMethod http://localhost:8001/health
   ```

4. Khởi động backend như bình thường. Mặc định Spring Boot gọi `http://localhost:8001`; có thể đổi bằng `OPENPRONOUNCE_BASE_URL`.

Compose riêng để `docker compose up -d` hiện tại không tự build model phát âm. Model weights được tải ở lần chấm đầu tiên và lưu trong volume `openpronounce-models`; lần đầu có thể mất vài phút. Dự án yêu cầu Python 3.10+, `ffmpeg` và `espeak-ng`; Dockerfile cài các phụ thuộc này trong container và mặc định chạy CPU. README upstream nêu hai Wav2Vec2 checkpoint, mỗi checkpoint khoảng 1.2 GB. TTS mặc định dùng gTTS nên cần mạng khi sinh câu mẫu mới.

Dừng riêng dịch vụ (không xoá cache model):

```powershell
docker compose -f compose.openpronounce.yml down
```

## Luồng ghi âm và dữ liệu

- Frontend gửi WAV đến `POST /api/exercise-attempts/{attemptId}/pronunciation/{itemId}` như trước.
- Backend gửi WAV + `reference_text` đến `POST /pronunciation` của OpenPronounce (`lang=en`).
- Backend trả điểm tổng, tỷ lệ khớp âm vị/từ, transcript và các khác biệt IPA.
- Neon lưu provider, transcript, điểm tổng, điểm âm vị và JSON kết quả trong `pronunciation_attempts`. File ghi âm không được lưu lâu dài; `recording_uri` để `NULL`.
- Dịch vụ OpenPronounce chỉ bind vào `127.0.0.1:8001`; không public port này. Khi triển khai backend lên máy chủ khác, đặt service trong private network và cấu hình URL nội bộ.

## Lưu ý chất lượng

Điểm tổng của OpenPronounce là ước lượng mô hình, không phải điểm chuẩn giáo viên hay Azure. Upstream ghi rõ mô hình được hiệu chỉnh chủ yếu cho tiếng Anh; giọng mạnh, tiếng ồn và trẻ em có thể làm kết quả kém hơn, và cảnh báo sai vẫn có thể xảy ra. Giao diện vì vậy trình bày các tỷ lệ khớp là xấp xỉ và cho thấy IPA mô hình nghe được để người học tự đối chiếu. Xem thêm phần limitations và MIT license trong repo upstream.
