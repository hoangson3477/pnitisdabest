import type { StoryStage } from "@/lib/types";

export const stages: StoryStage[] = [
  {
    "id": "bus",
    "title": "Chuyến xe và một cái tên lạ",
    "scene": "bus",
    "background": "/story/bus-inside-2.jpg",
    "lines": [
      {
        "speaker": "Người kể chuyện",
        "text": "Milu vừa vào lớp 10 THPT Phú Nhuận. Cậu thích mày mò máy tính, nhưng vẫn ngại bước vào một câu lạc bộ mới."
      },
      {
        "speaker": "Bạn cùng trường",
        "text": "Thứ Bảy này ghé PNIT với tụi mình không? CLB Tin học đó, có từ năm 2015 rồi."
      },
      {
        "speaker": "Milu",
        "text": "Tớ chưa biết code. Vào đó chắc ngồi nhìn mọi người làm mất?"
      },
      {
        "speaker": "Bạn cùng trường",
        "text": "Tớ cũng từng nghĩ vậy. Tên tiếng Anh của CLB là Phu Nhuan's Information Technology Club; mọi người gọi PNIT cho gọn. Thầy Hà Thanh Liêm phụ trách, còn các anh chị sẽ hướng dẫn mình."
      },
      {
        "speaker": "Milu",
        "text": "Vậy để tớ tìm hiểu thử. Biết đâu có thứ mình làm được."
      }
    ]
  },
  {
    "id": "yard",
    "title": "Mã QR trước cổng trường",
    "scene": "yard",
    "background": "/story/school-front-door.jpg",
    "portrait": "/story/milu-idle.png",
    "lines": [
      {
        "speaker": "Người kể chuyện",
        "text": "Tan học, Milu thấy poster PNIT trên bảng tin: tuyển học sinh khối 10, 11, 12 xuyên suốt năm học qua form apply."
      },
      {
        "speaker": "Milu",
        "text": "Không có laptop thì có tham gia được không chị?"
      },
      {
        "speaker": "Thành viên PNIT",
        "text": "Được em. Laptop mang theo nếu có, người mới được đào tạo từ đầu. Không có lệ phí gia nhập; quỹ hỗ trợ sự kiện là tự nguyện."
      },
      {
        "speaker": "Người kể chuyện",
        "text": "Milu quét QR. Một trang lạ yêu cầu cả mật khẩu Facebook khiến cậu chần chừ.",
        "image": "/story/recruitment-letter.jpg"
      },
      {
        "speaker": "Thành viên PNIT",
        "text": "Khoan nhập nhé! Mình kiểm tra địa chỉ qua fanpage chính thức trước. Form đăng ký không cần mật khẩu hay OTP của em."
      },
      {
        "speaker": "Milu",
        "text": "May mà em hỏi. Để em mở đúng form rồi mới điền."
      }
    ]
  },
  {
    "id": "thought",
    "title": "Buổi gặp đầu tiên",
    "scene": "lab",
    "background": "/story/computer-room.jpg",
    "portrait": "/story/milu-questioning.png",
    "lines": [
      {
        "speaker": "Người kể chuyện",
        "text": "Thứ Bảy, 15:30, Milu đến Phòng tin học 3. Buổi sinh hoạt kết thúc lúc 17:00. Vừa ngồi xuống, cậu đã được kéo ghế mời vào nhóm."
      },
      {
        "speaker": "Chị trưởng CLB",
        "text": "Ở đây tụi mình cùng thử lập trình, thiết kế, robotics, media. Sáng tạo – Vận dụng – Tự tin là ba giá trị của PNIT."
      },
      {
        "speaker": "Milu",
        "text": "Nhưng nếu em làm sai thì sao?"
      },
      {
        "speaker": "Bạn cùng nhóm",
        "text": "Thì mình cùng sửa! Có lỗi cứ báo rõ lúc nào nó xảy ra và góp ý vào việc cần sửa. Đừng đợi sát ngày trình bày."
      },
      {
        "speaker": "Chị trưởng CLB",
        "text": "Nhóm cũng cần chia người phụ trách và báo tiến độ. Khi cùng viết code, mình lưu thay đổi bằng Git để tránh ghi đè công việc của nhau."
      },
      {
        "speaker": "Milu",
        "text": "Vậy em muốn thử một trang giúp lớp nhớ lịch trực nhật và hạn nộp bài. Tuần rồi em quên mất một bài tập..."
      }
    ]
  },
  {
    "id": "lab",
    "title": "Ý tưởng nhỏ, kế hoạch rõ",
    "scene": "lab",
    "background": "/story/computer-room.jpg",
    "portrait": "/story/milu-idle.png",
    "lines": [
      {
        "speaker": "Milu",
        "text": "Một trang có lịch, chat, điểm số, thông báo... liệu một tuần làm xong không nhỉ?"
      },
      {
        "speaker": "Bạn cùng nhóm",
        "text": "Hay mình chỉ làm trang xem lịch và nhắc việc cho vài bạn thử trước? Đó là MVP: bản nhỏ đủ giải quyết nhu cầu chính để lấy phản hồi."
      },
      {
        "speaker": "Chị trưởng CLB",
        "text": "Nhóm mình dùng khung 5 bước: xác định vấn đề, đặt mục tiêu, chọn bản đầu tiên, chia việc, kiểm tra khả thi. Đây là một cách thực hành, không phải quy trình duy nhất."
      },
      {
        "speaker": "Milu",
        "text": "Em lo phần chat quá sức. Mình để sau, dành thời gian cho lịch trực nhật và hạn nộp bài nhé."
      },
      {
        "speaker": "Người kể chuyện",
        "text": "Lúc thử bản đầu, nút lưu bị lỗi khi để ngày trống. Milu định đổi hàng loạt dòng code, nhưng bạn cùng nhóm ngăn lại."
      },
      {
        "speaker": "Bạn cùng nhóm",
        "text": "Thử lại với ngày trống, đọc thông báo tìm nguyên nhân rồi sửa từng chỗ. Sau đó thử cả ngày trống lẫn ngày hợp lệ. Tách phần kiểm tra ngày thành hàm nhỏ sẽ dễ thử hơn."
      }
    ]
  },
  {
    "id": "home",
    "title": "Bản demo đầu tiên",
    "scene": "home",
    "portrait": "/story/milu-idle.png",
    "lines": [
      {
        "speaker": "Người kể chuyện",
        "text": "Tối đó, nút lưu đã hoạt động. Milu nghĩ đến chuyện dùng AI phân loại lời nhắc để thử trong một phiên bản sau."
      },
      {
        "speaker": "Milu",
        "text": "Mình phải đưa gì cho AI học nhỉ?"
      },
      {
        "speaker": "Bạn cùng nhóm",
        "text": "Với bài phân loại này, chuẩn bị lời nhắc mẫu có nhãn như bài tập hay trực nhật. Mô hình học quy luật từ dữ liệu đó. Bản demo cứ dùng dữ liệu giả, đừng đưa thông tin riêng của các bạn vào."
      },
      {
        "speaker": "Milu",
        "text": "Em hỏi AI thử thì nó tự thêm một hạn nộp bài chẳng có trong thông báo lớp!"
      },
      {
        "speaker": "Bạn cùng nhóm",
        "text": "Đó là thông tin AI tạo sai, dù nghe rất chắc chắn. Ngày giờ phải đối chiếu thông báo gốc hoặc hỏi giáo viên trước khi dùng."
      },
      {
        "speaker": "Người kể chuyện",
        "text": "Milu bỏ ngày bịa ra, giữ bản lịch đơn giản và gửi demo cho nhóm. Lần này cậu không còn ngại xin góp ý."
      }
    ]
  }
];

export const endingStage: StoryStage = {
  "id": "ending",
  "title": "Một nơi để bắt đầu",
  "scene": "lab",
  "background": "/story/computer-room.jpg",
  "portrait": "/story/milu-idle.png",
  "lines": [
    {
      "speaker": "Người kể chuyện",
      "text": "Buổi sinh hoạt sau, Milu mở demo. Một bạn thử thêm lịch, một bạn góp ý cách hiển thị ngày. Cuốn sổ của cậu lại có thêm việc cần làm."
    },
    {
      "speaker": "Milu",
      "text": "Nó vẫn còn nhỏ quá, liệu đem giới thiệu được không chị?"
    },
    {
      "speaker": "Chị trưởng CLB",
      "text": "Được chứ. Trước hết mình cho các bạn dùng thử và góp ý. Các cuộc thi như AI Challenge, Tin học trẻ hay KHKT là những hướng để thử sức tiếp."
    },
    {
      "speaker": "Người kể chuyện",
      "text": "Milu nhớ những thành tích của các anh chị: Olympic Tin học, Toán; các đội đạt giải AI Challenge; một đôi vào vòng dự tuyển KHKT cấp Quốc gia. Cậu muốn nghe thêm cách họ bắt đầu."
    },
    {
      "speaker": "Milu",
      "text": "Trước em nghĩ phải giỏi mới vào được PNIT. Giờ em có một nhóm để hỏi khi bí và cùng làm tiếp."
    },
    {
      "speaker": "Người kể chuyện",
      "text": "BỨT PHÁ TỎA SÁNG, KÍCH HOẠT KỶ NGUYÊN MỚI! Hành trình của Milu mới bắt đầu. Còn bạn, muốn thử điều gì cùng PNIT?"
    }
  ]
};
