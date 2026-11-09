import "server-only";

import type { KeywordGroup, Question, Variant } from "@/lib/types";

function tf(statement: string, answer: boolean): Variant {
  return { type: "true_false", points: 5, statement, answer };
}

function mc(options: string[], answerIndex: number): Variant {
  return { type: "choice", points: 10, options, answerIndex };
}

function sa(
  accepted: string[],
  hint: string,
  keywords?: KeywordGroup[],
): Variant {
  return { type: "short", points: 20, accepted, hint, ...(keywords ? { keywords } : {}) };
}

function q(
  id: string,
  prompt: string,
  explanation: string,
  variants: [Variant, Variant, Variant],
): Question {
  return { id, prompt, explanation, variants };
}

export const questions: Question[] = [
  // ==========================================
  // Chặng 1 — Chuyến xe và một cái tên lạ
  // ==========================================
  // Câu 1 [Dễ]: Khối lớp của Milu
  q(
    "new-student",
    "Milu vừa bước vào trường THPT Phú Nhuận ở khối lớp nào?",
    "Milu là học sinh mới vào lớp 10. PNIT chào đón học sinh cả 3 khối 10, 11 và 12 của trường tham gia.",
    [
      tf("Milu vừa vào học lớp 10 tại trường THPT Phú Nhuận.", true),
      mc(["Lớp 10", "Lớp 11", "Lớp 12", "Đại học"], 0),
      sa(["lop 10", "lớp 10", "10"], "Nhập tên khối lớp (ví dụ: lớp 11 hoặc 12)"),
    ],
  ),

  // Câu 2 [Dễ]: Năm thành lập và số năm hoạt động
  q(
    "pnit-founding",
    "CLB Tin học PNIT được thành lập vào năm nào và tính đến tháng 11/2026 đã có bao nhiêu năm hoạt động?",
    "PNIT được thành lập từ năm 2015, tính đến tháng 11/2026 đã có tròn 11 năm hoạt động liên tục.",
    [
      tf("PNIT được thành lập vào năm 2015 và đã hoạt động được 11 năm tính đến tháng 11/2026.", true),
      mc(["Năm 2015 (11 năm hoạt động)", "Năm 2018 (8 năm hoạt động)", "Năm 2020 (6 năm hoạt động)", "Năm 2012 (14 năm hoạt động)"], 0),
      sa(
        [
          "2015",
          "nam 2015",
          "năm 2015",
          "11 nam",
          "11 năm",
          "2015 11 nam",
          "2015 11 năm",
        ],
        "Nhập năm thành lập (ví dụ: 2018)",
        [
          { any: ["2015"], points: 10 },
          { any: ["11 nam", "11 năm", "11"], points: 10 },
        ],
      ),
    ],
  ),

  // Câu 3 [Khó]: Tên tiếng Anh chính thức và ngữ pháp
  q(
    "pnit-identity",
    "Tên tiếng Anh chính thức của PNIT là gì và cụm viết tắt 'PNIT' có điểm gì đáng chú ý về ngữ pháp?",
    "Tên chính thức là Phu Nhuan's Information Technology Club. Viết tắt là PNIT (Phu Nhuan Information Technology - thiếu sở hữu cách nên theo ngữ pháp tiếng Anh thì tên này không hợp).",
    [
      tf("Tên tiếng Anh chính thức của CLB là Phu Nhuan's Information Technology Club.", true),
      mc(["Phu Nhuan's Information Technology Club", "Phu Nhuan Information Technology Association", "Phu Nhuan Tech School Society", "Phu Nhuan Computer Network Club"], 0),
      sa(["phu nhuans information technology club", "phu nhuan's information technology club", "câu lạc bộ tin học", "cau lac bo tin hoc", "clb tin hoc", "clb tin học"], "Nhập tên tiếng Anh đầy đủ (ví dụ: ABC's Technology Club)"),
    ],
  ),

  // Câu 4 [Khó]: Thầy phụ trách và slogan
  q(
    "pnit-slogan-mentor",
    "Giáo viên phụ trách CLB Tin học PNIT là ai và khẩu hiệu (slogan) chính thức của CLB là gì?",
    "Giáo viên phụ trách CLB là thầy Hà Thanh Liêm. Slogan chính thức: 'BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI!'.",
    [
      tf("Thầy Hà Thanh Liêm là giáo viên phụ trách CLB với slogan 'BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI!'.", true),
      mc(["Thầy Hà Thanh Liêm · 'BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI!'", "Thầy Nguyễn Văn Nam · 'KẾT NỐI ĐAM MÊ, VƯƠN TẦM CÔNG NGHỆ'", "Cô Trần Thị Mai · 'SÁNG TẠO KHÔNG NGỪNG NGHỈ'", "Thầy Lê Minh Khôi · 'CHINH PHỤC ĐỈNH CAO TRI THỨC'"], 0),
      sa(["ha thanh liem", "hà thanh liêm", "thay ha thanh liem", "thầy hà thanh liêm"], "Nhập họ và tên giáo viên (ví dụ: Nguyễn Văn A)"),
    ],
  ),

  // ==========================================
  // Chặng 2 — Mã QR trước cổng trường
  // ==========================================
  // Câu 5 [Dễ]: Hình thức và chu kỳ tuyển thành viên
  q(
    "recruitment-cycle",
    "CLB Tin học PNIT tuyển thành viên vào thời gian nào và phương thức ứng tuyển chính xác là gì?",
    "PNIT tuyển thành viên xuyên suốt năm học thông qua hình thức làm form đăng ký trực tuyến (làm form để apply).",
    [
      tf("PNIT tuyển thành viên xuyên suốt năm học thông qua hình thức làm form đăng ký trực tuyến.", true),
      mc(["Làm form đăng ký (apply form), tuyển xuyên suốt năm học", "Chỉ tuyển 1 đợt duy nhất vào đầu tháng 9 bằng thi viết", "Phải qua phỏng vấn trực tiếp tại phòng Đoàn trường", "Chỉ tuyển chọn học sinh đạt giải cấp thành phố"], 0),
      sa(["lam form de apply", "làm form để apply", "lam form", "làm form", "dien form", "điền form", "xuyen suot nam hoc", "xuyên suốt năm học"], "Nhập phương thức đăng ký (ví dụ: qua biểu mẫu...)"),
    ],
  ),

  // Câu 6 [Dễ]: Người mới chưa biết code
  q(
    "no-experience-onboarding",
    "Học sinh chưa từng biết lập trình (chưa biết code) có được tham gia PNIT không?",
    "Được, PNIT sẽ đào tạo bài bản cho người mới từ con số 0. Thành viên chỉ cần mang thân đến, có laptop thì mang theo.",
    [
      tf("Học sinh chưa biết code hoàn toàn có thể tham gia và sẽ được PNIT đào tạo bài bản.", true),
      mc(["Được, CLB sẽ đào tạo bài bản từ số 0 (mang thân, laptop nếu có)", "Không, bắt buộc phải thành thạo ít nhất 2 ngôn ngữ lập trình", "Không, chỉ nhận học sinh có chứng chỉ tin học quốc tế", "Chỉ được tham gia nếu có máy tính xách tay cấu hình cao"], 0),
      sa(["duoc se dao tao bai ban", "được sẽ đào tạo bài bản", "duoc", "được", "dao tao bai ban", "đào tạo bài bản"], "Nhập câu trả lời ngắn (Được/Không và giải thích ngắn)"),
    ],
  ),

  // Câu 7 [Dễ]: Chính sách lệ phí
  q(
    "club-fee-structure",
    "Quy định về lệ phí gia nhập và nguồn quỹ hoạt động của PNIT như thế nào?",
    "PNIT hoàn toàn không thu lệ phí tham gia; chỉ thu quỹ CLB theo diện tự nguyện để chi trả chi phí khi tham gia các sự kiện, cuộc thi.",
    [
      tf("PNIT không thu lệ phí bắt buộc, chỉ thu quỹ theo diện tự nguyện để chi trả chi phí tham gia event.", true),
      mc(["Không lệ phí, chỉ thu quỹ CLB tự nguyện để chi trả sự kiện", "Thu lệ phí thành viên cố định 150.000đ/tháng", "Bắt buộc đóng phí cơ sở vật chất phòng máy hàng kỳ", "Thu phí hồ sơ khi nộp form apply trực tuyến"], 0),
      sa(["khong le phi", "không lệ phí", "khong co le phi", "không có lệ phí", "tu nguyen", "tự nguyện", "khong", "không"], "Nhập quy định về lệ phí (ví dụ: có/không thu phí...)"),
    ],
  ),

  // Câu 8 [Khó]: An toàn số - Phishing và bảo vệ thông tin
  q(
    "cybersecurity-phishing",
    "Khi quét mã QR trên poster hoặc nhận liên kết form qua mạng xã hội, quy tắc an toàn số nào là quan trọng nhất?",
    "Cần kiểm tra kỹ địa chỉ URL chính thức (tránh tấn công Phishing giả mạo), tuyệt đối không bao giờ chia sẻ mật khẩu cá nhân hay mã OTP.",
    [
      tf("Tuyệt đối không bao giờ cung cấp mật khẩu cá nhân hay mã OTP vào các biểu mẫu khảo sát trực tuyến.", true),
      mc(["Kiểm tra kỹ URL chính chủ, tuyệt đối không nhập mật khẩu hay mã OTP", "Bất kỳ biểu mẫu nào tạo qua Google Form đều tuyệt đối an toàn", "Nên điền mật khẩu tài khoản mạng xã hội để xác thực danh tính", "Tắt toàn bộ lớp bảo mật trình duyệt để tải form nhanh hơn"], 0),
      sa(["kiem tra url khong nhap mat khau", "kiểm tra url không nhập mật khẩu", "khong nhap mat khau", "không nhập mật khẩu", "khong chia se mat khau va otp", "không chia sẻ mật khẩu và otp", "an toan so", "an toàn số"], "Nhập nguyên tắc an toàn số (ví dụ: kiểm tra link, bảo mật thông tin...)", [{ any: ["url", "ten mien", "tên miền"], points: 10 }, { any: ["mat khau", "mật khẩu", "otp"], points: 10 }]),
    ],
  ),

  // ==========================================
  // Chặng 3 — Buổi sinh hoạt Phòng tin học 3
  // ==========================================
  // Câu 9 [Khó]: Lịch sinh hoạt và địa điểm
  q(
    "pnit-schedule-location",
    "Lịch sinh hoạt định kỳ và địa điểm gặp mặt của PNIT diễn ra vào khung giờ nào?",
    "Lịch sinh hoạt của PNIT diễn ra vào chiều Thứ 7, từ 3h30 đến 5h chiều (15:30 - 17:00), tại Phòng tin học 3.",
    [
      tf("PNIT sinh hoạt định kỳ vào chiều Thứ 7, 3h30 - 5h chiều tại Phòng tin học 3.", true),
      mc(["Thứ 7, 15:30 - 17:00 tại Phòng tin học 3", "Chủ nhật, 8:00 - 10:00 tại Phòng máy 1", "Chiều Thứ 6, 17:00 - 18:30 tại Thư viện", "Sáng Thứ 2, 7:00 - 8:30 tại Hội trường lớn"], 0),
      sa(["thu 7 phong tin hoc 3", "thứ 7 phòng tin học 3", "phong tin hoc 3", "phòng tin học 3", "thu 7 3h30 5h chieu", "thứ 7 3h30 5h chiều", "15:30 17:00"], "Nhập thứ, giờ và phòng sinh hoạt (ví dụ: Thứ Hai, 8h00, Phòng A1)"),
    ],
  ),

  // Câu 10 [Khó]: Ba giá trị cốt lõi
  q(
    "pnit-core-values",
    "Ba giá trị cốt lõi tạo nên bản sắc và tinh thần của các thành viên PNIT là gì?",
    "Ba giá trị cốt lõi của PNIT là: Sáng tạo - Vận dụng - Tự tin.",
    [
      tf("Ba giá trị cốt lõi của PNIT là: Sáng tạo - Vận dụng - Tự tin.", true),
      mc(["Sáng tạo - Vận dụng - Tự tin", "Kỷ luật - Tốc độ - Cạnh tranh", "Lý thuyết - Thành tích - Cá nhân", "Cần cù - Rập khuôn - An toàn"], 0),
      sa(
        [
          "sang tao van dung tu tin",
          "sáng tạo vận dụng tự tin",
          "sang tao",
          "sáng tạo",
          "van dung",
          "vận dụng",
          "tu tin",
          "tự tin",
        ],
        "Nhập 3 giá trị cách nhau bằng dấu gạch ngang (ví dụ: Từ 1 - Từ 2 - Từ 3)",
        [
          { any: ["sang tao", "sáng tạo"], points: 7 },
          { any: ["van dung", "vận dụng"], points: 7 },
          { any: ["tu tin", "tự tin"], points: 6 },
        ],
      ),
    ],
  ),

  // Câu 11 [Dễ]: Điểm khác biệt độc đáo
  q(
    "pnit-special-identity",
    "Điều gì tạo nên sự khác biệt đáng tự hào của PNIT so với các câu lạc bộ khác trong trường?",
    "Dù số lượng thành viên khá ít (hơn 20 người tính đến tháng 11/2026), nhưng PNIT luôn tràn đầy sự vui vẻ, gắn kết và đoạt nhiều giải thưởng ở các cuộc thi lớn nhỏ.",
    [
      tf("Dù số lượng khá ít (hơn 20 bạn), PNIT vẫn luôn vui vẻ và gặt hái nhiều giải thưởng lớn nhỏ.", true),
      mc(["Quân số hơn 20 người nhưng luôn vui vẻ và đoạt nhiều giải thưởng", "Có số lượng thành viên đông nhất trường với hơn 300 bạn", "Chỉ tập trung thi đấu thể thao điện tử mà không học code", "Là CLB duy nhất có phòng máy bay thử nghiệm riêng"], 0),
      sa(["it nguoi nhung vui ve doat nhieu giai thuong", "vui ve va doat nhieu giai thuong", "vui ve", "vui vẻ", "doat nhieu giai thuong", "đoạt nhiều giải thưởng"], "Nhập nét khác biệt nổi bật của CLB"),
    ],
  ),

  // Câu 12 [Khó]: Làm việc nhóm trong dự án công nghệ
  q(
    "teamwork-roles-git",
    "Trong một nhóm dự án công nghệ gồm nhiều mảng (lập trình, robotics, media, thiết kế), nguyên tắc làm việc nhóm hiệu quả nhất là gì?",
    "Phân chia rõ vai trò và trách nhiệm của từng cá nhân, chủ động giao tiếp cập nhật tiến độ và sử dụng công cụ quản lý phiên bản (như Git) để cộng tác đồng bộ.",
    [
      tf("Làm việc nhóm công nghệ đòi hỏi phân định rõ vai trò, giao tiếp cởi mở và quản lý phiên bản chung.", true),
      mc(["Phân chia vai trò rõ ràng, giao tiếp chủ động và quản lý phiên bản tập trung", "Giao toàn bộ công việc cho một thành viên giỏi nhất gánh đội", "Mỗi người tự làm riêng rẽ theo ý mình mà không cần thống nhất", "Không cần họp nhóm hay cập nhật tiến độ với nhau"], 0),
      sa(["phan chia vai tro ro rang giao tiep chu dong", "phan chia vai tro ro rang", "phân chia vai trò rõ ràng", "giao tiep chu dong", "giao tiếp chủ động", "lam viec nhom", "làm việc nhóm", "teamwork"], "Nhập nguyên tắc làm việc nhóm cốt lõi"),
    ],
  ),

  // ==========================================
  // Chặng 4 — Kế hoạch dự án & Bản demo
  // ==========================================
  // Câu 13 [Khó]: Lập kế hoạch dự án 5 bước
  q(
    "school-problem",
    "Vấn đề thực tế nào trong trường học đã thôi thúc Milu nảy ra ý tưởng làm dự án và khung lập kế hoạch gồm mấy bước?",
    "Milu thấy bạn bè hay quên lịch trực nhật và hạn nộp bài; nhóm áp dụng khung 5 bước: Xác định vấn đề -> Đặt mục tiêu -> Chọn MVP -> Phân chia việc -> Kiểm tra tính khả thi.",
    [
      tf("Ý tưởng của Milu xuất phát từ việc bạn bè hay quên lịch trực nhật và hạn nộp bài.", true),
      mc(["Bạn bè hay quên lịch trực nhật, hạn nộp bài (áp dụng quy trình 5 bước)", "Trường học thiếu phòng tập thể dục cho học sinh", "Xe buýt trường học không có máy điều hòa không khí", "Học sinh không tìm được chỗ mua đồ ăn sáng"], 0),
      sa(["quen lich va han nop bai", "quên lịch và hạn nộp bài"], "Nhập vấn đề thực tế cần giải quyết", [{ any: ["lich", "lịch"], points: 10 }, { any: ["han nop bai", "hạn nộp bài"], points: 10 }]),
    ],
  ),

  // Câu 14 [Khó]: Lập kế hoạch dự án - Ý nghĩa của MVP
  q(
    "project-idea",
    "Milu và nhóm đã thống nhất chọn làm sản phẩm gì và khái niệm MVP (Sản phẩm khả dụng tối thiểu) có ý nghĩa như thế nào?",
    "Nhóm chọn làm bản demo trang xem lịch và nhắc việc. MVP giúp hoàn thành nhóm tính năng cốt lõi trước để thử nghiệm thực tế nhanh nhất.",
    [
      tf("Bản demo trang xem lịch và nhắc việc là phiên bản MVP tập trung giải quyết bài toán cốt lõi.", true),
      mc(["Trang xem lịch và nhắc việc (MVP tập trung giải pháp cốt lõi trước)", "Một mạng xã hội video ngắn hoàn chỉnh với hàng triệu người dùng", "Một trò chơi 3D thế giới mở chạy trên máy chủ đám mây", "Một hệ thống thanh toán điện tử ngân hàng tích hợp"], 0),
      sa(["trang xem lich va nhac viec", "trang xem lịch và nhắc việc", "trang xem lich", "trang xem lịch", "mvp"], "Nhập tên hoặc loại sản phẩm của nhóm"),
    ],
  ),

  // Câu 15 [Khó]: Lập trình cơ bản - Kỹ thuật phân rã mô đun
  q(
    "programming-decomposition",
    "Trong lập trình cơ bản, kỹ thuật phân rã (decomposition) và tách hàm độc lập (modularity) mang lại lợi ích cốt lõi gì?",
    "Phân rã giúp chia nhỏ bài toán phức tạp thành các hàm nhỏ, dễ hiểu, dễ viết test độc lập và tái sử dụng, giúp mã nguồn mạch lạc và hạn chế lỗi.",
    [
      tf("Kỹ thuật phân rã giúp chia bài toán lớn thành các hàm đơn giản, dễ bảo trì và kiểm thử.", true),
      mc(["Chia nhỏ bài toán thành các hàm/module độc lập, dễ kiểm thử và bảo trì", "Viết dồn toàn bộ mã nguồn vào một hàm duy nhất dài hàng nghìn dòng", "Hạn chế đặt tên biến có nghĩa để làm cho code khó đọc hơn", "Làm cho chương trình chạy mà không cần nạp vào bộ nhớ máy tính"], 0),
      sa(["chia nho bai toan thanh cac ham", "chia nhỏ bài toán thành các hàm", "phan ra", "phân rã", "decomposition", "tach ham", "tách hàm", "modular", "mo dun", "mô đun"], "Nhập tên kỹ thuật hoặc lợi ích lập trình"),
    ],
  ),

  // Câu 16 [Khó]: Lập trình cơ bản - Quy trình gỡ lỗi (Debugging)
  q(
    "programming-debugging",
    "Khi chương trình báo lỗi (bug) trong quá trình phát triển, phương pháp gỡ lỗi (debugging) khoa học nhất là gì?",
    "Cần đọc kỹ thông báo lỗi và vết ngăn xếp (stack trace), xác định chính xác dòng lệnh gây lỗi, cô lập dữ liệu đầu vào và kiểm tra giả thuyết từng bước.",
    [
      tf("Đọc kỹ stack trace và cô lập nguyên nhân gốc rễ là phương pháp gỡ lỗi khoa học hơn việc sửa mò ngẫu nhiên.", true),
      mc(["Đọc kỹ thông báo lỗi/stack trace, cô lập dữ liệu và kiểm tra logic từng bước", "Xóa toàn bộ dự án và gõ lại từ đầu mà không cần quan sát lỗi", "Sửa đổi bừa bãi các câu lệnh cho tới khi máy tính không kêu lỗi", "Khởi động lại máy tính liên tục và hy vọng code tự sửa"], 0),
      sa(["doc thong bao loi va stack trace", "đọc thông báo lỗi và stack trace", "stack trace", "debugging", "go loi", "gỡ lỗi"], "Nhập phương pháp xử lý lỗi khoa học"),
    ],
  ),

  // ==========================================
  // Chặng 5 — Dòng code đầu tiên, AI & Đấu trường lớn
  // ==========================================
  // Câu 17 [Khó]: Trí tuệ nhân tạo (AI) - Nguyên lý Machine Learning
  q(
    "ai-machine-learning",
    "Trong các bài toán AI Challenge, mô hình học máy (Machine Learning) khác biệt cơ bản như thế nào so với lập trình truyền thống?",
    "Lập trình truyền thống đưa dữ liệu và quy tắc (rules) để ra kết quả; Machine Learning đưa dữ liệu và kết quả mẫu để thuật toán tự học quy luật (patterns).",
    [
      tf("Machine Learning tự động rút ra quy luật từ dữ liệu mẫu thay vì phụ thuộc hoàn toàn vào các quy tắc lập trình thủ công.", true),
      mc(["Tự học quy luật từ dữ liệu mẫu để đưa ra suy luận và dự đoán", "Chỉ thực thi danh sách các lệnh if-else cố định do con người viết sẵn", "Chỉ là một thuật toán tìm kiếm từ khóa trong cơ sở dữ liệu có sẵn", "Hoạt động hoàn toàn ngẫu nhiên mà không dựa trên bất kỳ dữ liệu nào"], 0),
      sa(["hoc quy luat tu du lieu", "học quy luật từ dữ liệu", "machine learning", "tu hoc tu du lieu", "tự học từ dữ liệu"], "Nhập nguyên lý vận hành của Machine Learning"),
    ],
  ),

  // Câu 18 [Khó]: AI & An toàn số - Hiện tượng Ảo giác (Hallucination)
  q(
    "ai-hallucination-safety",
    "Khi ứng dụng các mô hình ngôn ngữ lớn (LLM), hiện tượng ảo giác (hallucination) là gì và làm sao để đảm bảo an toàn số?",
    "Ảo giác là khi AI tạo ra câu trả lời sai lệch nhưng với giọng điệu rất tự tin. Cần kiểm chứng chéo với nguồn sự thật (ground truth) và thiết lập cơ chế kiểm duyệt dữ liệu đầu ra.",
    [
      tf("Hiện tượng ảo giác (hallucination) là khi mô hình AI tạo ra thông tin sai lệch một cách rất tự tin.", true),
      mc(["Hiện tượng AI bịa thông tin sai sự thật (cần kiểm chứng nguồn dữ liệu)", "Lỗi máy tính bị mất kết nối mạng Internet tạm thời", "Tấn công mã độc tống tiền (Ransomware) làm khóa dữ liệu", "Lỗi phần cứng màn hình máy tính bị nhấp nháy"], 0),
      sa(["ao giac", "ảo giác", "hallucination", "kiem chung", "kiểm chứng"], "Nhập tên thuật ngữ hiện tượng (tiếng Việt hoặc tiếng Anh)"),
    ],
  ),

  // Câu 19 [Khó]: Thành tích nổi bật của PNIT
  q(
    "pnit-achievements",
    "Những thành tích thi đấu nổi bật gần đây của các thành viên và đội tuyển PNIT gồm những giải thưởng nào?",
    "Olympic THPT môn Tin học & Toán (2025-2026), 3 nhóm đạt giải AI Challenge (2025-2026), 1 đôi vào vòng dự tuyển Khoa học Kỹ thuật cấp Quốc gia, 4 đội đạt giải AI Challenge (2024-2025).",
    [
      tf("PNIT có thành viên đạt giải Olympic Tin học, Toán (2025-2026) và 1 đôi vào dự tuyển KHKT cấp Quốc gia.", true),
      mc(["Olympic Tin/Toán (2025-2026), AI Challenge (2024-2025 & 2025-2026), dự tuyển KHKT Quốc gia", "Giải Vô địch Điền kinh và Bóng đá học sinh cấp Thành phố 2026", "Huy chương Vàng Tiếng Anh Hùng biện Toàn quốc 2025", "Giải Nhất Hội diễn Văn nghệ Hoa Phượng Đỏ 2024"], 0),
      sa(
        [
          "ai challenge olympic khkt",
          "ai challenge",
          "olympic",
          "khoa hoc ky thuat",
          "khoa học kỹ thuật",
          "khkt",
        ],
        "Nhập tên các giải thưởng hoặc cuộc thi tiêu biểu",
        [
          { any: ["ai challenge"], points: 7 },
          { any: ["olympic"], points: 7 },
          { any: ["khoa hoc ky thuat", "khoa học kỹ thuật", "khkt"], points: 6 },
        ],
      ),
    ],
  ),

  // Câu 20 [Khó]: Sự kiện thường niên và cuộc thi tham gia
  q(
    "annual-event-contests",
    "Sự kiện/workshop thường niên do PNIT tự tổ chức cho học sinh toàn trường và các cuộc thi CLB thường xuyên tham gia là gì?",
    "Sự kiện thường niên: PN Stem Innovations. Các cuộc thi thường xuyên: Nghiên cứu Khoa học, Khoa học Kỹ thuật, Tin học trẻ, AI Challenge (Sở KH&CN TPHCM).",
    [
      tf("PN Stem Innovations là workshop thường niên do PNIT tổ chức cho học sinh toàn trường.", true),
      mc(["PN Stem Innovations (thường niên) & Nghiên cứu KH, KHKT, Tin học trẻ, AI Challenge", "PN Hackathon Mùa Hè & Giải Đua xe Robot Quốc tế", "PN Tech Conference & Cuộc thi Sáng tác Truyện tranh AI", "Hội chợ Triển lãm Máy tính & Ngày hội Việc làm Công nghệ"], 0),
      sa(
        ["pn stem innovations", "stem innovations", "pn stem"],
        "Nhập tên sự kiện thường niên do CLB tổ chức",
        [
          { any: ["pn stem innovations", "stem innovations", "pn stem"], points: 10 },
          { any: ["tin hoc tre", "ai challenge", "khoa hoc ky thuat", "nghien cuu khoa hoc"], points: 10 },
        ],
      ),
    ],
  ),
];

export const questionById = new Map(questions.map((question) => [question.id, question]));
