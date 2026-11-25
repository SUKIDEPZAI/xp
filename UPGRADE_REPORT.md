# Báo cáo rà soát và nâng cấp — Windows XP Living Desktop v0.4.3

## 1. Phạm vi và kết luận kiến trúc

Đã kiểm tra source v0.4.2 được cung cấp và chỉnh trực tiếp lên v0.4.3. Dự án có thể chia thành năm lớp:

1. **Desktop/UI:** `ui/desktop.js`, `ui/desktop.css`, `ui/index.html`; đăng ký app, Paint, trình duyệt giả lập và hồ sơ Stickman.
2. **Runtime Stickman:** `ui/modules/stickman-runtime.js`, `ai-engine.js`, `perception.js`, `event-bus.js`; vòng lặp vật lý, nhận biết sự kiện desktop, lập kế hoạch, ký ức và tương tác.
3. **Đồ họa/animation:** `drawing-engine.js`, `animation-engine.js`, mới `stickman-appearance.js`; vector drawing, pose, keyframe và ngoại hình có cấu trúc.
4. **Lưu trữ local/cloud:** IndexedDB trong `storage-manager.js`; đồng bộ tài khoản trong `cloud-sync.js`.
5. **Backend/deploy:** Node API trong `server/`, Drizzle/PostgreSQL, migration trong `migrations/`, Docker 2 stage cho SnapDeploy.

**Kết luận:** nền tảng đang dùng mô hình local-first. Stickman và nội dung sáng tạo được lưu trong IndexedDB; khi đăng nhập và đồng bộ, Node API chuyển dữ liệu đến Neon PostgreSQL. SnapDeploy chạy cùng server Node, frontend và API cùng origin. Appearance được thêm trong JSONB `characters.profile`, animation dùng bảng animation hiện có; không cần thay đổi schema SQL cho v0.4.3.

## 2. Lỗi/điểm yếu đã phát hiện và xử lý

| Khu vực | Vấn đề trong source cũ | Cách xử lý ở v0.4.3 |
|---|---|---|
| Paint | Paint có canvas raster nhưng không có thanh công cụ tạo Stickman hoàn chỉnh; lệnh cũ chỉ gọi creator riêng và không ghi hình nhân vật lên canvas. | Thêm **Tạo Stickman** và danh sách **Chỉnh Stickman…** vào Paint. Tạo nhân vật xong mới vẽ nhân vật vào canvas; thao tác có snapshot để Undo. |
| Appearance | Hồ sơ chưa có hệ ngoại hình đầy đủ; renderer không nhận profile appearance nên thay đổi ngoại hình chưa thể hiện nhất quán trên desktop. | Thêm `XPStickmanAppearance`; có đầu, tông da, tóc, trang phục, màu, phụ kiện và biểu cảm. Renderer nhận `agent.profile.appearance`. |
| An toàn hình ảnh | Tự động xử lý toàn bộ pixel ảnh Paint có thể nhầm ảnh chụp/ảnh nền thành nhân vật. | Không chạy nhận diện hoặc sửa ảnh tự động. Bộ tối ưu chỉ nhận metadata của Stickman đã chọn; chỉ thao tác “Tạo Stickman” được người dùng xác nhận mới vẽ thêm một hình vector vào canvas. |
| Animation | Engine cũ có các project mẫu cố định; chưa sinh chuỗi chuyển động riêng gắn với hồ sơ nhân vật. | Thêm sinh keyframe theo tính cách và trait, metadata generator và preview từ hồ sơ. Mỗi Stickman mới tự nhận một animation. |
| AI needs | Giá trị need thiếu bị clamp về 0, làm nhân vật mới ưu tiên nghỉ hoặc có hành vi lệch ngay sau khi tạo. | Thêm `DEFAULT_NEEDS` cho energy, curiosity, social, entertainment, creativity, comfort và exploration. |
| AI goals/memory | Goal chỉ là dữ liệu thiên lệch sơ bộ, chưa có vòng đời tiến triển đủ rõ; ký ức social/creative chưa có trọng số riêng trong quyết định. | Thêm cập nhật progress/complete cho goal ngắn hạn, goal label hiển thị và bias từ ký ức social/creative được truy hồi. |
| Đổi tên | Tạo lại profile lúc rename có thể làm mất metadata appearance đã lưu. | Tái tạo trait profile nhưng giữ lại `profile.appearance`. |
| Paint restore | Danh sách chỉnh sửa được nạp trước khi IndexedDB load xong nên Stickman cũ có thể chưa hiện trong danh sách. | Phát sự kiện `stickman:loaded`; Paint và Stickman Manager refresh khi dữ liệu được khôi phục. |
| Web search | Web adapter thêm `https://` vào mọi input không có scheme; từ đơn như `cats` trở thành hostname thay vì search query. | Đồng bộ quy tắc với Electron: từ/cụm từ là search; domain/IP/localhost là navigation; nút **Tìm** ép tìm kiếm. Thêm lựa chọn Google/Bing/DuckDuckGo. |
| Ứng dụng sáng tạo | Script Animation Studio cũ vẫn được nạp, CSS cũ còn sót; thư viện tác phẩm nên gắn theo từng nhân vật thay vì là app riêng. | Không còn nạp `animation-studio.js`, xóa module/các style riêng; drawings và animations được mở trong hồ sơ Stickman. |

## 3. Luồng dùng mới

### Tạo Stickman trong Paint

1. Mở Paint và chọn **Tạo Stickman**.
2. Nhập tên, tính cách, màu nét; tùy chỉnh kiểu đầu, tông da, tóc, trang phục, phụ kiện và biểu cảm.
3. Quan sát preview. Nút **Tối ưu ngoại hình** cân chỉnh phối màu/chi tiết cho hồ sơ Stickman đang tạo.
4. Chọn **Tạo Stickman**. Nhân vật được lưu vào runtime; sau đó một lần vẽ vector được thêm lên canvas và có thể Undo.

### Chỉnh sửa nhân vật có sẵn

1. Mở Paint và chọn tên từ **Chỉnh Stickman…**, hoặc chọn **Ngoại hình** ở Stickman Manager / **Chỉnh ngoại hình trong Paint** trong hồ sơ.
2. Sửa thuộc tính rồi lưu. Đây là cập nhật `profile.appearance`, không phải thao tác sửa pixel ảnh.
3. Paint tiếp tục giữ nguyên nội dung ảnh đang mở; không có job tự động chạy qua các ảnh khác.

### Animation

- Khi tạo nhân vật, runtime sinh và lưu một project nhiều keyframe theo tính cách/trait.
- Hồ sơ có nút **Tạo animation** để sinh lại và mở preview.
- Animation lưu local trong IndexedDB; khi người dùng dùng Cloud Sync, project tham gia payload đồng bộ hiện tại.
- Đây là animation pose/keyframe có nội suy, không phải motion-capture hay skeletal rig đầy đủ.

## 4. Neon PostgreSQL và SnapDeploy

### Neon

- `DATABASE_URL`: connection string Neon pooled dùng cho request ứng dụng.
- `DATABASE_URL_UNPOOLED`: connection string direct/unpooled để chạy migration và thao tác quản trị.
- `SESSION_SECRET`: secret riêng, tối thiểu 32 bytes; chỉ đặt ở môi trường server.
- `characters.profile` là JSONB nên `profile.appearance` tương thích schema hiện tại.
- Không đưa connection string hoặc session secret vào `ui/`, HTML hay bundle browser.
- Chạy migration hiện có bằng `npm run db:migrate` qua release task hoặc môi trường quản trị tin cậy. Không chạy `drizzle-kit push` trực tiếp trên production.

### SnapDeploy

- Dockerfile hiện chỉ có hai stage, dùng Node 22 và bind `0.0.0.0:$PORT` (mặc định 8080), phù hợp giới hạn build stage đã ghi trong tài liệu source.
- Đặt private runtime variables: `NODE_ENV=production`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`.
- Port container cần là `8080` (không đặt `PORT=80` trong container unprivileged).
- `/health` là liveness; `/ready` kiểm tra database readiness. Nếu muốn chỉ route traffic khi Neon sẵn sàng, cấu hình readiness check `/ready`.
- Thực hiện migration trước khi bật tài khoản và đồng bộ.

**Giới hạn xác minh:** source và cấu hình đã được rà soát; không có thông tin xác thực Neon/SnapDeploy trong môi trường chỉnh sửa, do đó không tuyên bố đã kết nối DB, áp migration production hay deploy bản live.

## 5. Kiểm thử

Đã chạy thành công:

- `npm run check` — PASS.
- `npm test` — PASS.
- Regression mới gồm appearance schema allow-list, refine deterministic, animation nhiều keyframe theo character/personality, default needs, goal/appearance runtime guards, tìm từ đơn/cụm từ, force-search, domain/localhost và đổi search engine.
- Các test sẵn có cho API health/readiness, không có database thì account API fail-closed, Electron IPC isolation, WebContentsView và browser adapter vẫn PASS.

Chưa được xác minh trong môi trường này:

- Migration, đăng nhập, phân quyền, đồng bộ qua Neon thật.
- Docker image build và SnapDeploy deployment thực tế.
- Kiểm thử hình ảnh trực quan trên nhiều trình duyệt/kích thước màn hình.
- Rust/WASM build (không phải yêu cầu bắt buộc; JavaScript fallback vẫn là đường chạy dự phòng).

## 6. Các nâng cấp nên làm tiếp theo

### Ưu tiên cao

1. Thêm browser-level E2E (Playwright) cho Paint create/edit/undo, profile animation, IndexedDB restore và account sync.
2. Tự động sync sau các mutation có debounce, có retry/backoff và chỉ sync đúng owner account; hiện tại sync vẫn khởi động bằng hành động người dùng/đăng nhập và retry queue khi online.
3. Xây bộ kiểm thử Neon integration trong database tạm: migrate, register/login/logout, ownership/IDOR, profile JSONB, animation save/load, last-write-wins.
4. Thêm UI trạng thái animation khi sinh, hủy/redo và quản lý nhiều animation của một Stickman.

### Ưu tiên trung bình

5. Nâng cấp AI memory: tóm tắt ký ức dài hạn, decay/confidence có kiểm soát, retrieval theo nhiều thuộc tính và tránh ghi lặp.
6. Nâng cấp goal planner thành multi-step plan có điều kiện hoàn tất/thất bại và học trọng số từ kết quả hành động.
7. Thêm animation rig/skeleton, easing curves, onion-skin preview và xuất sprite sheet từ preview hiện tại.
8. Thêm lựa chọn mở trang ngoài rõ ràng hơn khi website chặn iframe. Không nên làm proxy web tổng quát thiếu SSRF protection.

### Chỉ triển khai khi có yêu cầu rõ

9. Nếu muốn biến ảnh vẽ thành Stickman, thiết kế như công cụ **chuyển đổi được chọn thủ công**: người dùng khoanh vùng/crop một hình, xem preview và xác nhận. Không chạy auto-convert trên mọi ảnh import hoặc toàn bộ canvas.
10. Nếu cần LLM thật, đặt model gateway ở backend, có quota/rate limit, kiểm soát dữ liệu gửi đi, timeout/fallback và không để API key trong frontend. AI hiện tại là utility planner deterministic chứ không phải LLM hay thực thể có ý thức.

## 7. Các giới hạn cần hiểu đúng

- “Tự tối ưu ngoại hình” hiện làm đẹp metadata profile theo palette/trait; không phải AI vision chỉnh ảnh bitmap.
- “Tự tạo animation” sinh project keyframe từ pose vocabulary hiện có; nó không huấn luyện/chuyển động từ video.
- “Bộ não” hiện là planner luật/utility, memory event và goal ngắn hạn. Mô tả là AI agent hoàn chỉnh hoặc sentient sẽ không chính xác.
- Trình duyệt web mô phỏng ở web-host mode dùng iframe sandbox. Một số website chặn nhúng bởi CSP/X-Frame-Options; trường hợp đó phải dùng **Mở ngoài**. Đây không phải lỗi tìm kiếm query, nhưng là giới hạn trình bày kết quả.
