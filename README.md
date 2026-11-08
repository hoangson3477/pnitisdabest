# PNIT · Hành trình khám phá CLB

Game kể chuyện pixel-art **không cần host/PIN**: mỗi bạn quét QR, theo chân Milu
qua 5 chặng để tìm hiểu CLB Tin học PNIT, trả lời 20 câu hỏi trên điện thoại.
Kết quả được chấm ở server, xếp hạng theo điểm và cập nhật gần thời gian thực.

- Mobile-first, tiếng Việt, giao diện sáng rõ để đọc ngoài trời.
- 5 chặng, 4 câu mỗi chặng, khoảng 7–10 phút. Thẻ **Ôn nhanh** là tùy chọn ở
  trang chủ, không bắt buộc trước khi chơi.
- Mỗi câu người chơi tự chọn: Đúng/Sai (5 điểm), trắc nghiệm (10 điểm) hoặc
  tự luận ngắn (20 điểm). Tổng tối đa 400 điểm.
- Phải chốt dạng trả lời trước khi xem nội dung câu hỏi; không đổi được dạng
  trong cùng một câu.
- Mỗi thiết bị được chơi **1 lượt** (cấu hình được).
- Có bảng xếp hạng công khai và trang quản trị để xóa lượt rác/reset dữ liệu.

## Công nghệ

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase Postgres (chỉ dùng ở server, không dùng Supabase Auth/Realtime)
- Triển khai trên Vercel

## Chạy local

Yêu cầu Node.js 22+ và npm.

```bash
npm install
```

Tạo file `.env.local` từ mẫu:

```powershell
Copy-Item .env.example .env.local
```

Điền các biến trong `.env.local` (xem hướng dẫn bên dưới), sau đó:

```bash
npm run dev
```

Mở http://localhost:3000.

## Cấu hình Supabase

1. Tạo project miễn phí tại https://supabase.com.
2. Vào **SQL Editor**, dán toàn bộ nội dung `supabase/schema.sql` và chạy.
   File này tạo bảng `attempts`, `attempt_answers`, `content_drafts`,
   `content_versions`, view `attempt_scores`, `leaderboard`, bật RLS và chặn
   truy cập từ client.
   Nếu database đã cài bằng schema cũ, chạy thêm
   `supabase/content-migration.sql`.
3. Vào **Project Settings → API**, lấy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở server. Không đặt tiền tố
`NEXT_PUBLIC_`, không gửi key này cho người khác.

> Project Supabase miễn phí tự pause sau 7 ngày không hoạt động. Trước ngày
> hội, mở dashboard Supabase bấm **Restore/Wake** rồi test lại một lượt chơi.

## Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `SUPABASE_URL` | Có | Project URL của Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Service role key, chỉ dùng server-side |
| `ADMIN_PASSWORD` | Có | Mật khẩu đăng nhập `/admin` |
| `ADMIN_SECRET` | Có | Chuỗi bí mật để ký cookie admin |
| `MAX_ATTEMPTS_PER_DEVICE` | Không | Số lượt/thiết bị, mặc định `1` (tối đa 5) |

Tạo `ADMIN_SECRET` ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Chỉnh nội dung CLB

Có hai cách:

1. **Qua admin (khuyến nghị):** mở `/admin`, đăng nhập, bấm **Sửa nội dung**.
   Sửa thông tin CLB, 5 chặng truyện và 20 câu hỏi, bấm **Lưu nháp**, xem trước
   nếu cần, rồi **Xuất bản**. Người chơi chỉ thấy bản đã xuất bản.
2. **Sửa file:** `src/content/club.ts`, `src/content/story.ts` và
   `src/content/questions.ts` vẫn là nội dung mẫu/fallback. Có thể sửa trực tiếp
   rồi deploy nếu chưa muốn dùng database.

Lưu ý:

- Nội dung mẫu là hư cấu — thay bằng thông tin thật trước khi dùng.
- **Chỉ được xuất bản khi chưa có lượt chơi.** Server và trigger database đều
  chặn thao tác này. Muốn đổi nội dung sau khi đã có người chơi, vào `/admin`
  reset dữ liệu trước.
- Nội dung nháp có thể sửa/lưu bất cứ lúc nào, kể cả khi đang có lượt chơi.
- Điểm cố định: Đúng/Sai 5, trắc nghiệm 10, tự luận 20; đúng 20 câu, tổng tối
  đa 400 điểm.
- Mỗi chặng có 1–6 lời thoại và ảnh nền/nhân vật/ảnh minh họa riêng. Ảnh để
  trống sẽ dùng nền CSS theo bối cảnh; ảnh hiện có nằm trong `public/story/`.
- Nên bấm **Xuất JSON** để backup trước khi thay đổi lớn. Lịch sử xuất bản cho
  phép khôi phục một bản cũ vào nháp.

## Cách chấm điểm

- Đúng/Sai: 5 điểm.
- Trắc nghiệm: 10 điểm.
- Tự luận ngắn: 20 điểm; so khớp sau khi chuẩn hóa dấu tiếng Việt, hoa/thường,
  khoảng trắng, dấu câu và các dạng ngày `14/3/2015`, `14-03-15`,
  `ngày 14 tháng 3 năm 2015`.
- Có thể cấu hình `keywords` để cho điểm một phần (ví dụ đúng ngày được 10,
  đúng năm được 10).
- Sai không bị trừ điểm.
- Xếp hạng: điểm giảm dần, cùng điểm thì ai hoàn thành sớm hơn đứng trước.

## Triển khai lên Vercel

1. Đưa code lên GitHub (không commit `.env.local`).
2. Vercel → **Add New Project** → import repo.
3. Thêm các biến môi trường ở trên cho cả **Production** và **Preview**.
4. Deploy. Sau đó mở domain production để kiểm tra.
5. Nếu đổi biến môi trường, vào **Deployments → Redeploy** để áp dụng.

Sau khi có domain, tạo QR trỏ về trang chủ (ví dụ
`https://quiz-clb.vercel.app/`). Có thể dùng bất kỳ công cụ tạo QR nào; in
A4/A5 dán tại sạp. Luôn quét thử QR trên 2 điện thoại trước khi in hàng loạt.

## Trang quản trị

Mở `/<domain>/admin`, đăng nhập bằng `ADMIN_PASSWORD`.

- Xem toàn bộ lượt chơi (tối đa 500 gần nhất), điểm và trạng thái.
- Xóa từng lượt rác.
- Reset toàn bộ dữ liệu (gõ `RESET` để xác nhận).
- **Sửa nội dung** (`/admin/content`): thông tin CLB, số liệu, thế mạnh, hoạt
  động, thẻ ôn nhanh, 5 chặng truyện (tiêu đề, bối cảnh, ảnh, lời thoại) và 20
  câu hỏi × 3 dạng. Có lưu nháp, xem trước, xuất/nhập JSON, lịch sử xuất bản và
  khôi phục bản cũ.
- Đăng xuất. Phiên admin kéo dài 12 giờ.

Chỉ được xuất bản nội dung khi chưa có lượt chơi. Nếu đã có người chơi, hãy
reset dữ liệu trước khi xuất bản.

Không chia sẻ URL `/admin` hoặc mật khẩu cho người chơi.

## Checklist ngày hội

- [ ] Đánh thức Supabase, test một lượt chơi thật trên điện thoại.
- [ ] Vào `/admin/content`, sửa nội dung thật, lưu nháp, xem trước và xuất bản.
- [ ] Reset dữ liệu test trong `/admin` trước giờ mở.
- [ ] Mở `/leaderboard` trên màn hình/laptop trình chiếu.
- [ ] Quét thử QR trên 2 điện thoại, chơi hết 1 lượt.
- [ ] Kiểm tra pin loa/màn hình, wifi, và một điện thoại phát 4G dự phòng.
- [ ] Theo dõi Vercel Logs trong 10 phút đầu để bắt lỗi cấu hình.

## Lưu ý và giới hạn đã biết

- Giới hạn 1 lượt/thiết bị dựa trên cookie `httpOnly`. Người chơi xóa cookie
  hoặc dùng tab ẩn danh có thể chơi lại — chấp nhận được với sự kiện nội bộ.
- Bảng xếp hạng làm mới mỗi ~8 giây khi tab đang mở, không dùng WebSocket.
- Khóa dạng trả lời được lưu ở `localStorage` phía trình duyệt; người rành kỹ
  thuật xóa storage hoặc gọi API trực tiếp vẫn đổi được dạng. Cần khóa phía
  server nếu muốn chặn triệt để.
- Không có AI chấm tự luận; chỉ chuẩn hóa chuỗi và so khớp danh sách đáp án.
- Câu trả lời được lưu tạm ở `localStorage` khi mất mạng để gửi lại; đáp án và
  điểm luôn được chấm ở server.
- Nội dung được lưu trong database dưới dạng bản nháp + lịch sử xuất bản. Chưa
  hỗ trợ sửa nội dung giữa các lượt chơi: phải reset dữ liệu trước khi xuất bản
  bản mới. Cách này giữ điểm các lượt trong cùng một sự kiện luôn công bằng.
- Nếu một thiết bị báo hết lượt nhưng cần chơi lại, admin có thể xóa lượt của
  thiết bị đó (hoặc reset toàn bộ) rồi người chơi tải lại trang.

## Scripts

```bash
npm run dev        # phát triển
npm run build      # build production
npm run start      # chạy bản build
npm run lint       # ESLint
npm test           # test chấm điểm và dữ liệu câu hỏi
npm run typecheck  # kiểm tra TypeScript
```

## Cấu trúc chính

```
src/app/                 trang và API routes
src/components/          story flow, bảng xếp hạng, admin
src/content/             nội dung CLB, chặng truyện và câu hỏi (server-only)
src/lib/                 chấm điểm, Supabase, auth, kiểu dữ liệu
supabase/schema.sql      schema + view xếp hạng
test/                    test chấm điểm và dữ liệu câu hỏi
```
