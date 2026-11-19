# Quy Định Trách Nhiệm Giao Nhận & Vận Tải Nông Sản Tươi (Delivery Responsibility & Logistics Operations Policy)

Quy định này thiết lập khung vận hành, phân định trách nhiệm pháp lý và quy trình phối hợp giao nhận nông sản tươi trên Nền tảng Kết nối và Điều phối Cung – Cầu Nông sản Thời gian thực FARMOSA (FARMORA). Nhằm khắc phục các điểm yếu cố hữu của chuỗi cung ứng nông nghiệp truyền thống — như thỏa thuận miệng dễ phá vỡ, bất cân xứng thông tin chất lượng và rủi ro thất thoát trong quá trình vận chuyển — tài liệu này quy định chi tiết luồng giao nhận 4 mốc có bằng chứng số, cơ chế chuyển giao rủi ro, khung xử lý đền bù sự cố và luồng tái điều phối giải cứu khẩn cấp.

---

## 1. Khung Định Hướng & Nguyên Tắc Chuyển Giao Rủi Ro (Transfer of Risk)

Hoạt động giao nhận trên hệ thống FARMOSA được thiết kế theo mô hình **Điều phối giao dịch có xác nhận (Mức M3)** kết hợp với **Quản lý vận tải L2 rút gọn**. Nền tảng giữ vai trò là đơn vị công nghệ trung lập, đóng đóng vai trò kiểm soát thông tin, xác lập điều khoản cam kết và giám sát vòng đời đơn hàng, trong khi hoạt động dịch chuyển hàng hóa và thanh toán tài chính trực tiếp do các bên tham gia tự thực hiện hoặc thông qua các đối tác chuyên trách.

### 1.1. Vị thế Nền tảng và Ranh giới Trách nhiệm
* **Nền tảng FARMOSA (Ecosystem Orchestrator)**: Chịu trách nhiệm duy trì tính sẵn sàng của hệ thống, vận hành thuật toán ghép nối đa tiêu chí, tính toán đếm ngược thời hạn bảo quản (TTL), phát cảnh báo rủi ro hư hỏng (Spoilage Risk Index - SPI) và thực thi cơ chế khóa giữ hàng phân tán. Nền tảng không trực tiếp sở hữu phương tiện vận tải, không thu mua nông sản và không chịu trách nhiệm bồi thường vật chất trực tiếp cho các tổn thất hàng hóa ngoài phạm vi lỗi phần mềm.
* **Các Bên Giao Dịch Trực Tiếp**: Người bán (Nông hộ/HTX), Người mua (Siêu thị/Doanh nghiệp/Nhà máy) và Đơn vị Vận tải (Nhà xe/Tài xế) chịu trách nhiệm dân sự và thương mại trực tiếp đối với tính trung thực của dữ liệu khai báo, chất lượng sản phẩm thực tế, điều kiện bảo quản lạnh và tiến độ giao nhận.

### 1.2. Nguyên Tắc Chuyển Giao Rủi Ro (Transfer of Risk)
Căn cứ theo Điều 57 Luật Thương mại 2005 Việt Nam và thông lệ thương mại nông sản tươi quốc tế (PACA):
* **Địa điểm chuyển giao rủi ro mặc định**: Rủi ro mất mát, hư hỏng hoặc suy giảm chất lượng nông sản được chuyển giao từ **Người bán sang Đơn vị vận tải (hoặc Người mua)** ngay khi hàng hóa được xếp xong lên phương tiện vận tải tại điểm tập kết/vùng trồng và hai bên hoàn tất xác nhận Biên bản Bàn giao Số (Mốc 2).
* **Trường hợp Người mua tự vận chuyển**: Rủi ro chuyển sang Người mua ngay sau khi hoàn tất bốc hàng lên xe của Người mua tại vườn/kho của Người bán.
* **Trường hợp có thỏa thuận riêng**: Các bên có quyền thỏa thuận mốc chuyển giao rủi ro khác (ví dụ: Chuyển giao tại kho Người mua - DDP) trong Văn bản Điều khoản Giao dịch (Term Sheet). Mốc thỏa thuận này phải được ghi nhận rõ trên hệ thống trước khi kích hoạt lệnh vận chuyển.

---

## 2. Quy Trình Bàn Giao 4 Mốc Và Bằng Chứng Số (L2 Logistics Process)

Để minh bạch hóa quá trình giao nhận mà không cần đầu tư hạ tầng IoT đắt đỏ trên toàn bộ phương tiện, FARMOSA triển khai quy trình 4 mốc bàn giao bắt buộc. Mỗi mốc đều yêu cầu dữ liệu xác thực hai phía và ảnh chụp thực địa làm bằng chứng pháp lý xử lý tranh chấp.

```
[Mốc 1: Nhận Chuyến] ──► [Mốc 2: Lấy Hàng (Chuyển Rủi Ro)] ──► [Mốc 3: Trung Chuyển] ──► [Mốc 4: Tới Nơi & Nghiệm Thu]
```

### 2.1. Mốc 1: Nhận Chuyến & Cam Kết Phương Tiện (Dispatch & Acceptance)
* **Kích hoạt**: Ngay khi điều khoản giao dịch (Term Sheet) được hai bên xác nhận, hệ thống tự động sinh Yêu cầu Vận chuyển (`Transportation Request`) chứa các tham số: Điểm lấy hàng, Điểm giao hàng, Khối lượng, Khung giờ sẵn sàng và Yêu cầu loại xe (xe thường hoặc xe thùng lạnh 5–8°C).
* **Hành động**: Đơn vị vận chuyển (hoặc Tài xế) tiếp nhận chuyến hàng trên ứng dụng di động, cam kết biển số xe, loại thùng xe và thời gian có mặt tại điểm lấy hàng.
* **Ràng buộc hệ thống**: Hệ thống tự động kiểm tra thời gian di chuyển dự kiến cộng với dải thời gian chờ. Nếu tổng thời gian vận chuyển vượt quá Thời gian bảo quản còn lại (TTL) của lô hàng, hệ thống sẽ từ chối gán chuyến và yêu cầu điều động phương tiện lạnh hoặc đổi tuyến đường.

### 2.2. Mốc 2: Bàn Giao Tại Điểm Lấy Hàng (Pick-up & Handover) — Mốc Chuyển Rủi Ro
* **Hành động**: Tài xế đến điểm tập kết/vườn, cùng Nông dân kiểm tra số lượng, cân khối lượng thực tế và chụp ảnh hiện trạng đóng gói/độ tươi của nông sản.
* **Xác thực số**: 
  1. Tài xế quét mã QR Lô hàng trên ứng dụng của Nông dân.
  2. Hai bên nhập số lượng cân thực tế (cho phép dung sai số lượng ±5% so với Term Sheet).
  3. Tải lên tối thiểu 2 ảnh chụp thực tế lô hàng đã xếp lên xe.
* **Hệ quả pháp lý**: Ngay khi nút **"Xác Nhận Bàn Giao"** được cả hai bên bấm, trạng thái lô hàng chuyển sang `IN_TRANSIT` (Đang vận chuyển). Rủi ro đối với hàng hóa chính thức chuyển sang Bên vận tải.

### 2.3. Mốc 3: Trung Chuyển & Báo Cáo Sự Cố Trên Đường (In-Transit Monitoring)
* **Hành động**: Trong quá trình di chuyển, Tài xế có trách nhiệm cập nhật trạng thái nếu xảy ra các sự cố bất khả kháng (hỏng xe, sự cố máy lạnh, tắc đường nghiêm trọng).
* **Cập nhật ETA**: Khi Tài xế báo sự cố hoặc thay đổi Thời gian đến dự kiến (ETA), hệ thống tự động tính toán lại chỉ số TTL tại điểm đến (`Remaining Shelf-life at Arrival`).
* **Cảnh báo thời gian thực**: Nếu ETA mới khiến nông sản có nguy cơ suy giảm chất lượng quá dải dung sai cho phép, hệ thống tự động bắn Cảnh báo Đỏ (Red Alert) về Bảng điều khiển của Người điều phối để kích hoạt luồng cứu hộ.

### 2.4. Mốc 4: Tới Nơi & Khai Mở Cửa Sổ Nghiệm Thu (Delivery & Inspection Window)
* **Hành động**: Xe đến kho/điểm giao của Người mua. Tài xế bấm **"Đã Đến Điểm Giao"** trên ứng dụng, hệ thống lập tức mở **Cửa Sổ Nghiệm Thu** có đếm ngược thời gian.
* **Khung thời gian nghiệm thu**: 
  * **02 giờ làm việc**: Đối với nông sản tươi cực kỳ nhạy cảm (như rau ăn lá, dải tươi ngắn).
  * **06 giờ làm việc**: Đối với trái cây tươi thông thường (xoài, thanh long, dưa hấu, sầu riêng).
* **Quy trình nghiệm thu**: Người mua tiến hành cân đối chứng, kiểm tra phẩm cấp và tải lên kết quả nghiệm thu (Đầy đủ / Một phần / Từ chối).
* **Quy tắc Tự Động Chấp Nhận (Automatic Acceptance)**: Nếu hết Cửa sổ Nghiệm thu mà Người mua không phản hồi hoặc không tải lên biên bản khiếu nại, hệ thống tự động ghi nhận lô hàng đã được nghiệm thu đạt chuẩn 100% và đóng hồ sơ giao nhận.

---

## 3. Phân Định Trách Nhiệm Thiệt Hại & Cơ Chế Bồi Thường (Liability & Damage Matrix)

Sự cố hư hỏng nông sản trong giao nhận được phân định trách nhiệm dựa trên đối chiếu dữ liệu giữa Mốc 2 (Bàn giao lấy hàng) và Mốc 4 (Nghiệm thu tại điểm giao), kết hợp quy chuẩn dung sai PACA.

### 3.1. Ma Trận Phân Định Lỗi & Trách Nhiệm Bồi Thường

| Kịch Bản Sự Cố | Dấu Hiệu Nhận Biết Qua Bằng Chứng Số | Bên Chịu Trách Nhiệm | Cơ Chế Xử Lý & Bồi Thường |
| :--- | :--- | :--- | :--- |
| **Giao thiếu khối lượng ngoài dung sai** | Cân thực tế tại Mốc 2 hoặc Mốc 4 thấp hơn số lượng Term Sheet quá 5%. | **Người bán** (nếu thiếu từ Mốc 2) <br>**Nhà xe** (nếu hao hụt từ Mốc 2 sang Mốc 4) | Trừ tiền tương ứng trên giá trị hóa đơn. Hạ 5–10 điểm uy tín của bên vi phạm. |
| **Sai phẩm cấp / Hàng lỗi từ gốc** | Ảnh chụp Mốc 2 cho thấy nông sản không đạt tiêu chuẩn VietGAP/Brix đã cam kết, hoặc phát hiện nấm mốc gốc. | **Người bán** | Người mua có quyền từ chối nhận hàng. Người bán chịu toàn bộ chi phí vận tải 2 chiều và bị trừ 15 điểm uy tín. |
| **Giao trễ chuyến bất thường làm hỏng hàng** | Thời gian di chuyển thực tế vượt quá ETA cam kết > 30% mà không có báo cáo sự cố hợp lệ; hàng bị dập/hư tại Mốc 4. | **Đơn vị Vận tải** | Nhà xe bồi thường 100% giá trị sản lượng bị hư hỏng do trễ chuyến và chịu toàn bộ chi phí cước vận chuyển. |
| **Vi phạm dải nhiệt độ bảo quản lạnh** | Hàng bị héo/chín sớm/biến chất tại Mốc 4 dù di chuyển đúng giờ (do không chạy máy lạnh 5–8°C). | **Đơn vị Vận tải** | Bồi thường tổn thất theo biên bản kiểm định. Hạ điểm uy tín nhà xe, khóa quyền nhận chuyến lạnh trong 30 ngày. |
| **Hàng hư hỏng tự nhiên trong dải dung sai** | Hàng di chuyển đúng giờ, đúng dải nhiệt, mức hư hỏng tại Mốc 4 nằm trong dải dung sai PACA (≤10% tổng khuyết tật). | **Người mua** (Rủi ro thương mại tự nhiên) | Người mua thanh toán đủ 100% giá trị đơn hàng theo quy định mua bán nông sản tươi. |
| **Chậm nghiệm thu gây hư hỏng hàng** | Tài xế đã báo Mốc 4 nhưng Người mua không dỡ hàng/không nghiệm thu đúng Cửa sổ Nghiệm thu. | **Người mua** | Tự động kích hoạt thanh toán 100%. Người mua chịu mọi rủi ro hư hỏng phát sinh do ngâm xe. |

### 3.2. Áp Dụng Khung Dung Sai PACA Trong Nghiệm Thu
Trừ khi các bên có thỏa thuận khác trong Term Sheet, tiêu chuẩn dung sai khuyết tật tự nhiên khi giao nhận nông sản tươi trên FARMOSA được áp dụng theo quy chuẩn PACA:
* **Tổng khuyết tật cho phép**: Tối đa **10%** tổng khối lượng lô hàng.
* **Khuyết tật nghiêm trọng (Dập nát, biến dạng)**: Tối đa **5%** tổng khối lượng.
* **Hư hỏng nặng (Thối rữa, nấm mốc hoại tử)**: Tối đa **1%** tổng khối lượng.
* *Lưu ý*: Nếu tỷ lệ khuyết tật thực tế tại Mốc 4 nằm trong dải dung sai trên, Người mua không được quyền từ chối nhận toàn bộ lô hàng mà chỉ được đề xuất giảm trừ thanh toán theo tỷ lệ khuyết tật thực tế.

### 3.3. Đòn Bẩy Điểm Tín Nhiệm (Credit Rating System) & Hòa Giải Nền Tảng
Do hệ thống không trực tiếp giữ tiền giao dịch nội bộ, đòn bẩy tuân thủ được thực thi thông qua **Hệ thống Điểm Tín Nhiệm**:
* **Dung sai Điểm Uy Tín**: Mỗi tài khoản bắt đầu với 100 điểm. Vi phạm giao nhận (hủy chuyến ngang hông, giao thiếu, ngâm xe, từ chối nhận hàng vô cớ) sẽ bị trừ từ 5 đến 20 điểm tùy mức độ.
* **Thăng hạng & Giới hạn**: Tài khoản dưới 70 điểm sẽ bị hạn chế quyền tham gia Đấu giá và đặt trước. Tài khoản dưới 50 điểm sẽ bị hệ thống tạm khóa quyền giao dịch trong 60 ngày.
* **Quy trình Hòa giải Tranh chấp**: Khi có khiếu nại tại Mốc 4, Người điều phối (Coordinator) đóng vai trò trọng tài xem xét nhật ký sự cố, ảnh Mốc 2/Mốc 4 và đưa ra Phán quyết Hòa giải trong vòng **24 giờ làm việc**. Phán quyết của Người điều phối là căn cứ cuối cùng để điều chỉnh Điểm Tín Nhiệm và cập nhật báo cáo nghĩa vụ giữa hai bên.

---

## 4. Quy Trình Tái Điều Phối & Báo Động Giải Cứu Khẩn Cấp (Proactive Rescue & Rerouting)

Một trong những điểm đột phá của FARMOSA là khả năng ứng phó chủ động với các sự cố giao nhận trên đường, không để rủi ro phát triển thành đợt nông sản hư hỏng hoàn toàn.

```
[Phát Hiện Sự Cố / Trễ Chuyến] ──► [AI Tính Lại SPI & Phát Cảnh Báo Đỏ] ──► [Coordinator Duyệt Phương Án Giải Cứu] ──► [Tài Xế Chuyển Hướng Xe]
```

### 4.1. Ngưỡng Kích Hoạt Báo Động
Hệ thống tự động phát Cảnh Báo Đỏ (Red Alert) tới Người điều phối khi xuất hiện một trong các điều kiện sau:
1. Tài xế báo sự cố nghiêm trọng tại Mốc 3 (hỏng xe, tai nạn) dự kiến kéo dài > 4 giờ.
2. Cập nhật ETA mới khiến Thời gian bảo quản còn lại tại điểm giao (`Remaining TTL at Arrival`) giảm xuống dưới **20%** tổng thời gian bảo quản của lô hàng.
3. Người mua từ chối nhận hàng tại Mốc 4 và lô hàng không thể chở ngược về nguồn gốc do nguy cơ thối hỏng.

### 4.2. Luồng Tái Điều Phối Kịch Bản 3 Tầng
Khi Cảnh Báo Đỏ được kích hoạt, Mô-đun Xử lý Rủi ro (`Rescue & Risk Service`) tự động quét dữ liệu không gian (PostGIS/Elasticsearch) và đề xuất 3 kịch bản cứu hộ cho Người điều phối phê duyệt:
* **Kịch bản 1: Chuyển hướng sang Người mua phụ (Secondary Buyer)**: Tìm kiếm các Doanh nghiệp/Thương lái ở gần vị trí xe hiện tại đang có nhu cầu thu mua cùng loại nông sản với giá chiết khấu (chấp nhận phẩm cấp hạ tầng).
* **Kịch bản 2: Đổi lộ trình về Nhà máy Chế biến (Processing Facility)**: Tự động chuyển hướng xe đến cơ sở sấy khô, làm mứt, ép nước hoặc đông lạnh gần nhất trên tuyến đường để bán cắt lỗ, thu hồi giá trị nguyên liệu.
* **Kịch bản 3: Kênh Từ thiện / Cứu hộ Xã hội**: Kích hoạt điều chuyển lô hàng đến các tổ chức từ thiện/kênh cứu trợ địa phương nếu thời gian TTL còn lại dưới 12 giờ, giúp tối ưu hóa chi phí tiêu hủy và đóng góp giá trị cộng đồng.

---

## 5. Ma Trận Trách Nhiệm Vận Hành RACI (Operational RACI Matrix)

Ma trận RACI dưới đây phân định rõ ràng vai trò của 8 nhóm đối tượng trong toàn bộ chuỗi hoạt động giao nhận và vận tải nông sản trên FARMOSA:
* **R (Responsible)**: Bên trực tiếp thực hiện công việc.
* **A (Accountable)**: Bên chịu trách nhiệm cuối cùng và có quyền phê duyệt.
* **C (Consulted)**: Bên cung cấp thông tin/tư vấn chuyên môn.
* **I (Informed)**: Bên nhận thông báo theo dõi trạng thái.

| Hoạt Động Giao Nhận & Vận Tải | Nông Hộ (SUP) | Người Mua (BUY) | Đơn Vị Vận Tải (LOG) | Điều Phối Viên (FO) | Kiểm Định (QC) | Tác Nhân AI (AI) | Quản Trị Hệ Thống (ADM) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Khai báo yêu cầu vận chuyển (B7)** | I | C | R | **A** | - | C (Gợi ý xe) | I |
| **Xác nhận nhận chuyến (Mốc 1)** | I | I | **R / A** | I | - | C (Kiểm TTL) | I |
| **Chuẩn bị & Đóng gói nông sản** | **R / A** | C | I | I | C | - | - |
| **Kiểm tra chất lượng & Cân Mốc 2** | **R** | I | **R** | I | C (Nếu có) | - | - |
| **Xác nhận Bàn giao QR Code (Mốc 2)** | **A** (Bên giao) | I | **A** (Bên nhận) | I | - | C (Trừ tồn kho) | I |
| **Giám sát Mốc 3 & Cập nhật ETA** | - | I | **R / A** | I | - | C (Tính lại SPI) | I |
| **Phát Cảnh báo trễ chuyến / Hư hỏng** | - | I | C | I | - | **R / A** (Tự động) | I |
| **Giao hàng & Khai Mốc 4** | I | I | **R / A** | I | - | C (Mở đếm ngược) | I |
| **Nghiệm thu & Kiểm phẩm cấp Mốc 4** | I | **R / A** | I | I | C | - | - |
| **Xử lý khiếu nại & Bồi thường** | C | C | C | **A** (Hòa giải) | C (Bằng chứng) | C (Gợi ý) | R (Cập nhật điểm) |
| **Duyệt luồng Tái điều phối Giải cứu** | C | C | C | **A** (Phê duyệt) | - | R (Đề xuất kịch bản) | I |

---

## 6. Điều Khoản Thi Hành & Áp Dụng

1. **Hiệu lực áp dụng**: Quy định này có hiệu lực bắt buộc đối với tất cả các thành viên (Nông hộ, Doanh nghiệp thu mua, Đơn vị vận tải) ngay khi hoàn tất đăng ký tài khoản và xác nhận điều khoản sử dụng trên nền tảng FARMOSA.
2. **Sửa đổi & Cập nhật**: Nền tảng FARMOSA có quyền điều chỉnh các tham số dung sai, khung thời gian nghiệm thu hoặc quy định điểm uy tín để phù hợp với thực tế mùa vụ và quy định pháp luật hiện hành. Thông báo thay đổi sẽ được gửi trước 14 ngày làm việc thông qua ứng dụng và email chính thức.
