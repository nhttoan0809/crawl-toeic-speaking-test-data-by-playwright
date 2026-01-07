# TOEIC Speaking Data Crawler

## 🎯 Sứ mệnh (Mission)
Dự án này được xây dựng nhằm mục đích **tự động hóa quy trình thu thập dữ liệu đề thi TOEIC Speaking** từ nền tảng Study4. Mục tiêu cuối cùng là chuyển đổi dữ liệu thô từ web thành định dạng **Markdown** sạch đẹp, dễ đọc, và có cấu trúc rõ ràng để phục vụ việc lưu trữ, tra cứu và luyện tập offline.

Điểm nổi bật là khả năng **duy trì trạng thái đăng nhập** (session) để tránh phải đăng nhập thủ công liên tục và khả năng xử lý/làm sạch dữ liệu văn bản tự động.

## 🚀 Quy trình thực hiện (Worflow)
Dự án đã trải qua các bước phát triển để đạt được kết quả là kho dữ liệu trong folder `data_markdown/`:

1.  **Authentication**: Thực hiện đăng nhập một lần và lưu trữ session cookie.
2.  **Crawling**: Tự động truy cập danh sách URL, tìm link bài thi thật (real exam) và bóc tách dữ liệu 5 phần thi.
3.  **Renaming**: Chuẩn hóa tên file theo định dạng dễ quản lý (`slug-id_ID`).
4.  **Transformation**: Chuyển đổi JSON sang Markdown, đồng thời làm sạch văn bản (tách từ dính, xóa prefix thừa) và cảnh báo các phần cần kiểm tra thủ công.

## 📂 Cấu trúc & Chức năng Scripts

Dưới đây là danh sách các file mã nguồn chính và nhiệm vụ của chúng:

| Tên File | Chức năng (Nhiệm vụ) | Dữ liệu Đầu vào (Input) | Dữ liệu Đầu ra (Output) |
| :--- | :--- | :--- | :--- |
| **`auth.js`** | Mở trình duyệt để người dùng đăng nhập thủ công, sau đó lưu trạng thái phiên làm việc (cookies, local storage) để dùng lại. | Thông tin đăng nhập của người dùng (nhập trên UI). | File `state.json` (chứa session state). |
| **`urls.js`** | Chứa danh sách các URL gốc của các bài thi TOEIC Speaking cần thu thập. | N/A (Hardcoded list). | Array các URL string. |
| **`scrape.js`** | Script chính thực hiện việc duyệt qua các link trong `urls.js`, xử lý logic để vào trang làm bài, và cào dữ liệu của 5 Items. | `urls.js`, `state.json`. | Các file JSON thô trong folder `data/` (Ví dụ: `sw-speaking-test-1-id_5895.json`). |
| **`convert_to_md.js`** | Chuyển đổi và làm sạch data. Biến JSON thành Markdown, fix lỗi dính chữ (regex), và thêm cảnh báo cho phần bảng biểu phức tạp (Item 4). | Các file JSON trong `data/`. | Các file Markdown hoàn chỉnh trong folder `data_markdown/`. |
| **`rename_files.js (deprecated)`** | Tiện ích đổi tên file trong folder `data` để đảm bảo tên file chứa cả `slug` (tên bài) và `id` bài thi cho dễ nhận diện. | Các file trong `data/`, `urls.js`. | File được đổi tên trong `data/`. |
| **`verify_data.js (test only)`** | Kiểm tra và xác nhận các file Markdown đã được chuyển đổi đúng định dạng và không có lỗi. | Các file Markdown trong `data_markdown/`. | File `verified.md` chứa danh sách các file đã được xác nhận. |

## 🛠 Hướng dẫn chạy (How to run)

1.  **Cài đặt dependencies**:
    ```bash
    npm install
    ```
2.  **Đăng nhập (Chạy 1 lần đầu)**:
    ```bash
    node auth.js
    ```
3.  **Thu thập dữ liệu**:
    ```bash
    node scrape.js
    ```
4.  **Chuyển đổi sang Markdown**:
    ```bash
    node convert_to_md.js
    ```

## ⚠️ Trường hợp có thể gặp cần lưu ý (Cases to Note)

1.  **Khi chạy `node auth.js`**:
    -   Bạn cần đăng nhập thành công trên trình duyệt, sau đó quay lại terminal và **nhấn ENTER** để script lưu lại file session.
    -   Hãy chú ý dòng nhắc trong terminal như sau:
    
    ```text
    Navigating to study4.com...
    Please log in manually in the browser window.
    Once you have successfully logged in, press ENTER in this terminal to save the session state and exit.
    Press ENTER to save state...
    ```

2.  **Về file `state.json`**:
    -   Đây là file chứa session (cookies/local storage) của trình duyệt cụ thể được Playwright tạo ra.
    -   Nó **không mang tính tái sử dụng** đa nền tảng (không thể copy sang máy khác hoặc trình duyệt khác để dùng trực tiếp nếu không cùng environment).

3.  **Xử lý lỗi Timeout khi Crawl (`node scrape.js`)**:
    -   Khi chạy `node scrape.js`, đôi khi bạn sẽ gặp lỗi `TimeoutError` (do mạng chậm hoặc server phản hồi lâu), dẫn đến việc thiếu file dữ liệu.
    -   Ví dụ về đoạn log báo lỗi:
    
    ```text
    Processing: https://study4.com/tests/5907/toeic-sw-speaking-test-13/
    Generated Real Exam URL: https://study4.com/tests/5907/practice/?part=14655&...
    Error processing https://study4.com/tests/5907/toeic-sw-speaking-test-13/: page.waitForLoadState: Timeout 30000ms exceeded.
        at /Path/To/scrape.js:80:24 {
      name: 'TimeoutError'
    }
    ```
    
    -   **Cách khắc phục**: Hãy chạy lại script.
    -   **Mẹo tối ưu**: Để tiết kiệm thời gian, hãy cập nhật file `urls.js` và chỉ giữ lại những đường dẫn bị lỗi. Ví dụ:
    
    ```javascript
    module.exports = [
        // ... xóa các link đã thành công ...
        "https://study4.com/tests/5907/toeic-sw-speaking-test-13/",
        "https://study4.com/tests/5937/toeic-sw-speaking-test-29/"
    ];
    ```
