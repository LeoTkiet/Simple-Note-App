# Simple Note App

Dự án ứng dụng ghi chú đơn giản với kiến trúc Client-Server, sử dụng **FastAPI** cho Backend và **HTML/CSS/JS (Vanilla)** cho Frontend. Backend cung cấp API và phục vụ static files cho Frontend.
Đặc biệt tích hợp thêm chức năng **Tâm sự cùng AI** sử dụng LLM qua API của Groq, có bảo mật bằng mật khẩu cho từng người dùng.

## Yêu cầu hệ thống
- Python 3.8 trở lên.
- Trình duyệt web hiện đại.

## Hướng dẫn cài đặt environment

1. **Clone repository và di chuyển vào thư mục:**
   ```bash
   git clone <URL_CUA_REPO>
   cd Simple-Note-App
   ```

2. **Tạo và kích hoạt Virtual Environment (Khuyến khích):**
   - Trên Windows:
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - Trên macOS/Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Cài đặt các thư viện phụ thuộc:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Cấu hình biến môi trường và Firebase:**
   - Tạo file `.env` tại thư mục gốc với các thông tin cấu hình Firebase như sau:
     ```env
     FIREBASE_API_KEY=your_api_key
     FIREBASE_AUTH_DOMAIN=your_auth_domain
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     FIREBASE_APP_ID=your_app_id
     GROQ_API_KEY=your_groq_api_key
     ```
   - Thêm file `serviceAccountKey.json` vào thư mục `backend/` (Đây là file chứa private key của Firebase Admin SDK để backend giao tiếp với Firestore).

## Hướng dẫn chạy dự án

Dự án được cấu hình để FastAPI Backend tự động phục vụ các file tĩnh của Frontend, do đó bạn chỉ cần chạy Backend là có thể truy cập được cả hai.

### Hướng dẫn chạy Backend & Frontend
Từ thư mục gốc của dự án (`Simple-Note-App`), chạy lệnh sau để khởi động server FastAPI:
```bash
uvicorn backend.main:app --reload
```

Server sẽ khởi chạy tại địa chỉ: **http://127.0.0.1:8000**
- Truy cập **http://127.0.0.1:8000** bằng trình duyệt để sử dụng trang web (Frontend).
- Các API của Backend được cung cấp tại **http://127.0.0.1:8000/notes**, **http://127.0.0.1:8000/config**, v.v.

## Cấu trúc thư mục
- `frontend/`: Chứa mã nguồn giao diện (HTML, CSS, JS).
- `backend/`: Chứa mã nguồn server (FastAPI, Routers, Schemas, Services).
- `requirements.txt`: Danh sách các thư viện cần cài đặt.
- `.gitignore`: File cấu hình loại bỏ các file không đưa lên Git.

## Video demo
https://github.com/user-attachments/assets/b0e40f40-a83b-4dfe-b909-824b32cca032


