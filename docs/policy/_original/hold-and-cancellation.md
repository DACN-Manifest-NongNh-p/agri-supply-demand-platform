# QUY CHẾ GIỮ HÀNG, ĐẶT CỌC VÀ HỦY ĐƠN HÀNG (HOLD & CANCELLATION POLICY)

**Hệ thống Điều phối Cung - Cầu và Logistics Nông sản Thời gian thực (FARMOSA / FARMORA)**

---

## 1. TỔNG QUAN VÀ CƠ CHẾ KHÓA GIỮ HÀNG PHÂN TÁN (REDIS REDLOCK)

Nhằm giải quyết triệt để rủi ro bán vượt quá số lượng (overbooking), tranh chấp nguồn cung đồng thời và đảm bảo tính công bằng trong giao dịch nông sản tươi nhạy cảm với thời gian, nền tảng FARMOSA áp dụng cơ chế Khóa Phân tán (Redis Distributed Lock - Redlock) kết hợp Thời gian sống của dữ liệu (Time-To-Live - TTL).

### 1.1. Nguyên lý Khóa Giữ hàng Tạm thời (Holding Lock)

Khi Người mua kích hoạt thao tác Đặt giữ hàng (Reserve Batch) hoặc thắng thầu phiên Đấu giá, hệ thống không lập tức chuyển giao quyền sở hữu vĩnh viễn mà thiết lập một bộ khóa tạm thời trên bộ nhớ đệm In-memory Redis.

1. **Khởi tạo Khóa Phân tán (`holding:lot:{lot_id}`):** Ngay khi yêu cầu đặt giữ được ghi nhận, hệ thống sinh ra một định danh khóa duy nhất chứa ID người mua, số lượng giữ và ID đơn phân bổ. Số lượng nông sản tương ứng sẽ bị trừ khỏi hạn mức khả dụng (`available_quantity`) của Lô hàng trong cơ sở dữ liệu.
2. **Cửa sổ Thời gian Giữ hàng (Holding TTL Window):** Thời gian giữ khóa mặc định là **15 phút** (900 giây). Trong cửa sổ thời gian này, không có bất kỳ người dùng nào khác có thể đặt giữ hoặc can thiệp vào lượng nông sản đã bị khóa.
3. **Giải phóng Khóa Tự động (Automatic Expiry & Keyexpiration Event):** 
   * **Trường hợp Thành công:** Người mua hoàn tất thủ tục xác nhận/đặt cọc trong vòng 15 phút, trạng thái khóa chuyển thành `CONFIRMED` và ghi nhận giao dịch vĩnh viễn.
   * **Trường hợp Quá hạn:** Nếu đếm ngược kết thúc mà giao dịch chưa được xác nhận, sự kiện hết hạn Redis (`Keyexpiration Event`) tự động kích hoạt, giải phóng khóa và hoàn trả số lượng nông sản về trạng thái sẵn sàng giao dịch (`AVAILABLE`).

---

## 2. VÒNG ĐỜI TRẠNG THÁI VÀ NGUYÊN TẮC CHUYỂN GIAO (STATE MACHINE LIFECYCLE)

Toàn bộ các thực thể Lô hàng, Đơn đặt trước, Phiên đấu giá và Chuyến xe Vận tải được quản lý nghiêm ngặt thông qua Máy trạng thái hữu hạn (Finite State Machine).

### 2.1. Mã Trạng thái Lô hàng (`supply_lots`)

| Trạng thái | Ý nghĩa Nghiệp vụ | Thao tác Hợp lệ |
| :--- | :--- | :--- |
| `PRE_HARVEST` | Nông sản đang phát triển trên vườn, chưa đến ngày thu hoạch. | Mở phiên Đấu giá Tương lai, Bật chế độ Đặt hàng trước (Pre-Order). |
| `AVAILABLE` | Nông sản đã thu hoạch hoặc sẵn sàng giao ngay tại Hub/Trang trại. | Đặt mua giao ngay, Đặt giữ hàng 15 phút. |
| `HOLDING` | Lô hàng đang trong thời gian khóa cọc/khóa giữ 15 phút bởi người mua. | Xác nhận đặt cọc, Hủy khóa để hoàn trả. |
| `ALLOCATED` | Đã chốt hợp đồng B2B/Đơn hàng, tiền cọc hoặc thanh toán đã xác nhận. | Lập lịch xe vận tải, Chuẩn bị đóng gói. |
| `IN_TRANSIT` | Đã bàn giao cho đơn vị vận tải, hàng đang di chuyển trên đường. | Theo dõi định vị GPS & Nhiệt độ kho lạnh thời gian thực. |
| `EXPIRED` | Thời hạn bảo quản (`Shelf-life/TTL`) chạm mốc nguy cơ hư hỏng. | Kích hoạt Luồng Điều chuyển Giải cứu Khẩn cấp (Proactive Rescue). |

---

## 3. CHÍNH SÁCH TIỀN CỌC, HOÀN TIỀN VÀ TỊCH THU CỌC (DEPOSIT & FORFEITURE MATRIX)

Quy định tài chính được thiết lập nhằm phân định trách nhiệm minh bạch giữa Người bán (Nông hộ) và Người mua (Doanh nghiệp/Thương lái) trong các kịch bản giao dịch Đặt hàng trước và Đấu giá.

### 3.1. Ma trận Xử lý Tiền cọc Đặt hàng trước (Pre-Order Deposit Rules)

Đối với các đơn Đặt hàng trước nông sản chưa thu hoạch, tỷ lệ tiền cọc tối thiểu mặc định là **20%** trên tổng giá trị đơn hàng.

| Tình huống Giao dịch | Trách nhiệm & Hướng xử lý Tiền cọc |
| :--- | :--- |
| **Người mua đơn phương Hủy đơn hợp lệ** (Không có lý do bất khả kháng) | Tịch thu **100% tiền cọc** (Chuyển cho Nông dân đền bù cơ hội thị trường và chi phí dưỡng vườn). |
| **Nông dân đơn phương Hủy đơn** / Bán tự do ra bên ngoài | Hoàn **100% tiền cọc** cho Người mua + Phạt đền bù thêm **100% giá trị cọc** (Phạt vi phạm hợp đồng B2B). |
| **Thiên tai, Dịch bệnh, Sương muối** (Có xác nhận từ Trạm Kiểm lâm/Sở NN&PTNT) | Hoàn **100% tiền cọc** cho Người mua. Không áp dụng phạt đền bù cho Nông dân (Sự kiện Bất khả kháng). |
| **AI Thẩm định Sản lượng thực tế < 80%** so với cam kết ban đầu | Người mua có quyền: (1) Nhận sản lượng thực tế theo giá điều chỉnh; hoặc (2) Hủy đơn & Nhận lại **100% cọc**. |

### 3.2. Quy định Đấu giá & Phạt Hủy Lệnh Trả giá (Auction Cancellation)

* **Tạm khóa Cọc Đấu giá:** Người mua tham gia phòng đấu giá phải liên kết tài khoản thanh toán và bị khóa tạm thời một khoản cọc tham gia (Bid Deposit).
* **Hủy Lệnh thắng thầu:** Trường hợp Người mua ra giá cao nhất (`Highest Bidder`) nhưng từ chối ký Hợp đồng Bao tiêu Tương lai trong vòng **24 giờ** kể từ khi phiên đóng:
  * Tịch thu **100% tiền cọc đấu giá**.
  * Chuyển giao quyền mua cho Người ra giá cao thứ 2 (`Second Highest Bidder`) nếu mức giá chênh lệch không vượt quá **5%**.
  * Khóa quyền tham gia các phiên đấu giá trên nền tảng trong vòng **30 ngày**.

---

## 4. QUY TRÌNH XỬ LÝ HỦY ĐƠN VÀ SỰ CỐ VẬN TẢI LOGISTICS

Vận chuyển nông sản tươi đòi hỏi quy trình phản ứng nhanh khi xuất hiện sự cố hỏng hóc phương tiện hoặc sai lệch nhiệt độ kho lạnh trên đường (`In-transit Decay`).

### 4.1. Sự cố Phương tiện & Hỏng Kho lạnh (Carrier Dispatch Breakdown)

1. **Cảnh báo Khẩn cấp:** Khi nhiệt độ kho lạnh vượt ngưỡng quy định quá 45 phút hoặc xe gặp sự cố giao thông, Tài xế phát tín hiệu qua App. Hệ thống lập tức bắn sự kiện `LOGISTICS_INCIDENT_EVENT` vào Apache Kafka.
2. **Điều xe Thay thế Tự động:** Trình điều phối Logistics truy vấn danh sách các phương tiện rảnh rỗi (`fleets`) trong bán kính **30 km** để điều chuyển lô hàng sang xe mới, bảo vệ thời gian bảo quản còn lại.
3. **Kích hoạt Luồng Giải cứu Khẩn cấp (Proactive Rescue Pipeline):**
   * Nếu thời gian khắc phục sự cố kéo dài khiến chỉ số rủi ro hư hỏng do AI tính toán (`Spoilage Risk Index`) vượt ngưỡng **0.35 (35%)**, Người điều phối (Coordinator) có quyền can thiệp dừng hành trình gốc.
   * Lô hàng lập tức được điều hướng về Cơ sở Chế biến nông sản gần nhất (sấy khô, ép nước, làm mứt) hoặc bán hạ giá giải cứu khẩn cấp trên sàn để thu hồi vốn tối đa cho các bên.

---

## 5. KHUNG NGHIỆM THU CHẤT LƯỢNG (PACA) VÀ HỆ THỐNG ĐIỂM TÍN NHIỆM

Nhằm ngăn chặn hành vi từ chối nhận hàng vô căn cứ khi giá thị trường biến động, hệ thống áp dụng Quy chuẩn Dung sai Nghiệm thu PACA (Perishable Agricultural Commodities Act) chuẩn quốc tế.

### 5.1. Khung Dung sai Nghiệm thu Sản lượng & Chất lượng (PACA Tolerance Standards)

| Tiêu chí Kiểm định | Mức Dung sai Chấp nhận | Hướng Xử lý khi Vượt Ngưỡng |
| :--- | :--- | :--- |
| **Biến động Khối lượng Thực tế** (So với Đơn đặt hàng) | Trong khoảng **± 5%** | Thanh toán theo khối lượng cân thực tế tại Điểm giao (Hub/Kho). |
| **Tỷ lệ Hao hụt / Tì vết Tự nhiên** (Dày vỏ, sẹo nhỏ không ảnh hưởng ruột) | Dưới hoặc bằng **8%** tổng khối lượng | Người mua bắt buộc nhận hàng, không được phép từ chối hoặc hủy. |
| **Khớp quy chuẩn Phân loại** (Grade A/B) | Độ lệch dưới **10%** | Giảm giá trừ trực tiếp theo biên độ chênh lệch phẩm cấp. |
| **Khuyết tật Nặng / Dập nát / Nấm mốc** (Do Lỗi Vận chuyển hoặc Bán hàng) | Vượt quá **15%** tổng lô hàng | Người mua có quyền **Từ chối nhận lô hàng**; Khởi tạo Tranh chấp. |

### 5.2. Hệ thống Đánh giá Uy tín và Điểm Tín nhiệm (Credit Rating System)

Mọi hành vi hủy đơn, bỏ cọc hoặc khai báo thông tin sai lệch đều trực tiếp khấu trừ Điểm Tín nhiệm (`Credit Rating`) của tài khoản trên hệ thống Keycloak IAM.

* **Thang điểm Khởi tạo:** 100 điểm cho tài khoản đã xác thực.
* **Quy tắc Trừ điểm Vi phạm:**
  * Hủy đơn Đặt hàng trước không có lý do hợp lệ: **-20 điểm / lần**.
  * Bỏ thầu sau khi thắng phiên Đấu giá: **-30 điểm / lần**.
  * Bán chui lô hàng đã có cam kết Đặt giữ cọc: **-40 điểm / lần**.
* **Chế tài Xử phạt theo Ngưỡng điểm:**
  * **Điểm < 70:** Tăng tỷ lệ tiền cọc bắt buộc khi Đặt trước / Đấu giá lên **40%**.
  * **Điểm < 50:** Tạm khóa quyền tạo phiên Đấu giá và Đặt hàng trước trong **60 ngày**.
  * **Điểm < 30:** Đình chỉ tài khoản vĩnh viễn, đưa vào Danh sách Đen (Blacklist) toàn hệ thống.
