import type { StoryStage } from "@/lib/types";

// Nội dung mặc định; admin có thể thay toàn bộ trong /admin/content.
export const stages: StoryStage[] = [
  {
    id: "bus",
    title: "Chuyến xe và một cái tên lạ",
    scene: "bus",
    background: "/story/bus-inside-2.jpg",
    lines: [
      { speaker: "Người kể chuyện", text: "Milu vừa vào lớp 10 THPT Phú Nhuận. Cậu luôn tò mò về công nghệ nhưng chưa biết câu lạc bộ nào phù hợp." },
      { speaker: "Người kể chuyện", text: "Trên chuyến xe buýt đến trường, Milu nghe hai bạn phía trước sôi nổi bàn về một buổi sinh hoạt sắp tới." },
      { speaker: "Bạn cùng trường", text: "Thứ 7 này PNIT sinh hoạt ở Phòng tin học 3 đó! Thầy Hà Thanh Liêm và các anh chị hướng dẫn tận tình lắm." },
      { speaker: "Milu", text: "PNIT là gì vậy bạn? Viết tắt của tên nào thế?" },
      { speaker: "Bạn cùng trường", text: "Phu Nhuan's Information Technology Club — thành lập từ năm 2015 với slogan: 'BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI!'." },
      { speaker: "Người kể chuyện", text: "Dù cụm viết tắt hơi lạ về ngữ pháp, ngọn lửa nhiệt huyết của cái tên PNIT khiến Milu thấy vô cùng tò mò." },
    ],
  },
  {
    id: "yard",
    title: "Mã QR trước cổng trường",
    scene: "yard",
    background: "/story/school-front-door.jpg",
    portrait: "/story/milu-idle.png",
    lines: [
      { speaker: "Người kể chuyện", text: "Tan học, ngang qua bảng tin trước cổng trường, Milu nhìn thấy poster tuyển thành viên có in logo chính thức của PNIT." },
      { speaker: "Người kể chuyện", text: "Poster có mã QR với thông báo: Tuyển thành viên khối 10, 11, 12 xuyên suốt năm học qua form apply. Không thu lệ phí!", image: "/story/recruitment-letter.jpg" },
      { speaker: "Milu", text: "Mình chưa từng biết code, cũng chưa có laptop, liệu có đăng ký được không nhỉ?" },
      { speaker: "Thành viên PNIT", text: "Được chứ em! Chỉ cần mang thân đến, CLB đào tạo bài bản từ số 0. Quỹ CLB chỉ thu tự nguyện khi tham gia sự kiện thôi." },
      { speaker: "Thành viên PNIT", text: "Nhớ quét mã QR kiểm tra đúng URL form chính chủ, luôn giữ an toàn số và không bao giờ nhập mật khẩu/OTP nha." },
      { speaker: "Người kể chuyện", text: "Milu hít một hơi, giơ điện thoại quét mã điền form apply, háo hức chờ đón buổi gặp đầu tiên." },
    ],
  },
  {
    id: "thought",
    title: "Buổi sinh hoạt Phòng tin học 3",
    scene: "thought",
    portrait: "/story/milu-questioning.png",
    lines: [
      { speaker: "Người kể chuyện", text: "Chiều Thứ 7 đúng 15h30, Milu bước vào Phòng tin học 3. Căn phòng rộn rã tiếng cười và sự thân thiện." },
      { speaker: "Người kể chuyện", text: "Các bạn đang say sưa trao đổi về lập trình, robotics, media và thử nghiệm mô hình AI cho các giải đấu lớn." },
      { speaker: "Milu", text: "CLB mình hơn 20 bạn mà ai cũng gắn kết và đạt nhiều giải thưởng lớn ghê!" },
      { speaker: "Chủ nhiệm CLB", text: "Đó là vì PNIT hoạt động trên ba giá trị cốt lõi: Sáng tạo - Vận dụng - Tự tin. Dù ít người nhưng như một gia đình." },
      { speaker: "Thành viên nhóm", text: "Trong làm việc nhóm công nghệ, tụi mình luôn phân định vai trò rõ ràng, giao tiếp chủ động và quản lý phiên bản cùng nhau." },
      { speaker: "Người kể chuyện", text: "Cảm giác ấm áp, hòa đồng và được thuộc về nơi này khiến Milu hoàn toàn tan biến sự bỡ ngỡ ban đầu." },
    ],
  },
  {
    id: "lab",
    title: "Kế hoạch dự án & Bản demo",
    scene: "lab",
    background: "/story/computer-room.jpg",
    portrait: "/story/milu-idle.png",
    lines: [
      { speaker: "Người kể chuyện", text: "Milu cùng nhóm thảo luận ý tưởng: làm một trang web nhỏ xem lịch và nhắc việc để hỗ trợ bạn bè trong trường." },
      { speaker: "Chủ nhiệm CLB", text: "Ý tưởng hay! Hãy áp dụng quy trình 5 bước: Xác định vấn đề -> Đặt mục tiêu -> Chọn MVP -> Phân chia việc -> Kiểm tra khả thi." },
      { speaker: "Milu", text: "Em hiểu rồi, tụi mình sẽ làm MVP giải quyết vấn đề cốt lõi là nhắc lịch trực nhật và hạn nộp bài trước." },
      { speaker: "Thành viên nhóm", text: "Khi lập trình, nhớ áp dụng kỹ thuật phân rã chia bài toán thành các hàm độc lập để dễ gỡ lỗi (debugging) nhé." },
      { speaker: "Người kể chuyện", text: "Cả nhóm cùng nhau phác thảo giao diện, chia nhỏ công việc và bắt tay vào hiện thực hóa ý tưởng." },
    ],
  },
  {
    id: "home",
    title: "Code, AI và Tinh thần đồng đội",
    scene: "home",
    background: "/story/bus-outside-green.png",
    portrait: "/story/milu-idle.png",
    lines: [
      { speaker: "Người kể chuyện", text: "Tối hôm đó bên bàn học, Milu bắt đầu gõ những dòng code đầu tiên cho bản demo lịch và nhắc việc." },
      { speaker: "Milu", text: "Mình thử nghiệm tính năng AI hỗ trợ phân loại lời nhắc, nhưng cần lưu ý gì nhỉ?" },
      { speaker: "Bạn cùng nhóm", text: "Cần cẩn thận hiện tượng ảo giác (hallucination) của AI và luôn đảm bảo an toàn thông tin cá nhân của người dùng nhé!" },
      { speaker: "Người kể chuyện", text: "Milu kiên trì đọc thông báo lỗi, sửa từng hàm. Cuối cùng, bản demo chạy thành công trên trình duyệt!" },
      { speaker: "Chủ nhiệm CLB", text: "Làm tốt lắm! Đây sẽ là bước đệm để tụi mình hướng tới sự kiện PN Stem Innovations và các kỳ thi lớn sắp tới!" },
      { speaker: "Người kể chuyện", text: "Milu mỉm cười tự hào. Một dòng code nhỏ hôm nay đã mở ra cả một chân trời sáng tạo cùng PNIT." },
    ],
  },
];

export const endingStage: StoryStage = {
  id: "ending",
  title: "Kết thúc: Nơi bắt đầu kỷ nguyên mới",
  scene: "yard",
  background: "/story/school-front-door.jpg",
  portrait: "/story/milu-idle.png",
  lines: [
    { speaker: "Người kể chuyện", text: "Trong buổi sinh hoạt tiếp theo tại Phòng tin học 3, Milu tự tin trình bày bản demo trước toàn thể CLB." },
    { speaker: "Thầy Hà Thanh Liêm", text: "Thầy rất mừng khi thấy các em biết vận dụng kiến thức công nghệ để giải quyết bài toán thực tế của học sinh trường mình." },
    { speaker: "Thành viên PNIT", text: "Từ Olympic Tin học, Toán đến AI Challenge hay KHKT Quốc gia, mọi thành tích của PNIT đều bắt đầu từ những dự án nhỏ như thế này." },
    { speaker: "Milu", text: "Cảm ơn thầy và các anh chị! Ở PNIT, em không chỉ học được Code và AI, mà còn tìm thấy một gia đình để cùng bứt phá." },
    { speaker: "Người kể chuyện", text: "BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI! — PNIT luôn sẵn sàng chào đón bạn!" },
  ],
};
