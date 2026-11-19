# Hướng Dẫn & Hỏi Đáp Nghiệp Vụ Dành Cho Doanh Nghiệp, Siêu Thị & Người Mua (Buyer FAQ)

Tài liệu này cung cấp toàn bộ hướng dẫn nghiệp vụ, quy trình giao dịch, cơ chế bảo vệ quyền lợi và quy định vận hành dành cho **Doanh nghiệp bán lẻ, Chuỗi siêu thị, Doanh nghiệp xuất khẩu và Người mua sỉ (Buyer)** trên Nền tảng Điều phối Cung – Cầu & Logistics Nông sản Thời gian thực **FARMOSA / FARMORA**.

---

## 1. Khái Quát & Đăng Ký Nhu Cầu (Demand Intent & Sourcing Overview)

### Q1: Hệ thống FARMOSA / FARMORA giúp Doanh nghiệp Mua giải quyết bài toán nguồn cung nông sản tươi như thế nào?

Nền tảng FARMOSA / FARMORA chuyển đổi phương thức thu mua nông sản truyền thống vốn manh mún, phụ thuộc qua nhiều tầng trung gian sang mô hình **Điều phối trực tiếp dựa trên dữ liệu chuỗi thời gian (Temporal Inventory Management)**.

* **Minh bạch nguồn gốc & Vùng trồng**: Doanh nghiệp tiếp cận trực tiếp danh mục lô hàng nông sản tươi được chuẩn hóa thông tin về loại giống, vị trí địa lý, thời gian thu hoạch thực tế/dự kiến và chứng nhận chất lượng (VietGAP, GlobalGAP, Organic, Phytosanitary).
* **Đảm bảo thời hạn bảo quản tươi (`Shelf-life/TTL`)**: Mọi lô hàng hiển thị trên nền tảng đều gắn liền với chỉ số đếm ngược thời gian bảo quản tươi, giúp Doanh nghiệp chủ động lên kế hoạch phân phối và bán lẻ trước khi sản phẩm suy giảm phẩm cấp.
* **Chủ động nguồn cung dài hạn**: Thông qua các công cụ **Đấu giá hợp đồng tương lai (Pre-Harvest Bidding)** và **Đặt hàng trước (Pre-Order Booking)**, Doanh nghiệp chủ động chốt trước sản lượng thu hoạch với giá cố định hoặc giá đấu thầu cạnh tranh mà không lo thiếu hụt nguồn hàng vào mùa cao điểm.

### Q2: Quy trình khai báo nhu cầu thu mua (`Declare Demand Intent`) diễn ra ra sao?

Để tìm kiếm hoặc nhận gợi ý nguồn cung tự động, Doanh nghiệp thực hiện khai báo Yêu cầu thu mua (`Demand Intent`) trên ứng dụng Web/Mobile theo các bước:

1. **Thiết lập thông số đơn hàng**: Nhập chủng loại nông sản, tổng khối lượng yêu cầu (kg/tấn), quy chuẩn chất lượng tối thiểu, mức giá trần mong muốn và địa điểm nhận hàng (tọa độ GPS kho/siêu thị).
2. **Cấu hình thời hạn nhận hàng (`Delivery Deadline`)**: Xác định mốc thời gian tối đa hàng phải cập kho để phục vụ luồng kinh doanh.
3. **Kích hoạt luồng Khớp nối (Matching Stream)**: Sau khi đăng ký, yêu cầu thu mua sẽ được hệ thống phân tích và đẩy vào bộ lọc tìm kiếm không gian (`Elasticsearch Geo-distance`) để tự động quét và kết nối với các lô hàng phù hợp nhất trong bán kính địa lý tối ưu.

---

## 2. Khớp Nối Nguồn Cung Đa Tiêu Chí & Gom Lô Hàng (Multi-Criteria Matching & Aggregation)

### Q3: Thuật toán Matching dựa trên những chỉ số nào để đề xuất nguồn hàng tối ưu cho Người mua?

Hệ thống sử dụng Thuật toán Phân bổ Đa tiêu chí (Multi-Criteria Matching Engine) để tự động tính toán và xếp hạng điểm tương thích (`Matching Score`) giữa Nhu cầu của Doanh nghiệp và các Nguồn cung hiện có dựa trên 4 chỉ số cốt lõi:

* **Mức độ ưu tiên thời hạn bảo quản (`FEFO - First Expire, First Out`)**: Ưu tiên ghép nối Doanh nghiệp với các lô hàng có thời gian bảo quản còn lại ngắn nhất nhưng vẫn đủ đáp ứng cửa sổ vận chuyển và bán hàng, giúp tối ưu hóa chuỗi tươi sống.
* **Khoảng cách địa lý & Chi phí vận chuyển (`Geo-Distance Optimization`)**: Đo lường khoảng cách thực tế giữa vị trí thu gom/vườn và kho nhận hàng thông qua ma trận khoảng cách OSRM/OpenStreetMap để giảm thiểu thời gian di chuyển và cước phí logistics.
* **Độ tương thích chất lượng & Chứng nhận**: Tự động lọc và khớp các lô hàng đạt đúng chuẩn chứng nhận mà Doanh nghiệp yêu cầu (VietGAP, GlobalGAP, không dư lượng thuốc BVTV).
* **Chỉ số Rủi ro Hư hỏng (`Spoilage Risk Index - SPI`)**: Lọc bỏ các lô hàng có nguy cơ hư hỏng vượt ngưỡng an toàn trong suốt hành trình vận chuyển dự kiến.

### Q4: Hệ thống gom nhiều lô hàng nhỏ của nông dân thành "Siêu lô hàng" (Mega-Batch) cho đơn hàng lớn bằng cách nào?

Đối với các đơn hàng thu mua quy mô lớn từ Siêu thị hoặc Doanh nghiệp xuất khẩu (ví dụ: cần 20 tấn Thanh long VietGAP cùng lúc), hệ thống kích hoạt thuật toán **Gom nguồn cung tự động (Supply Aggregation)**:

* **Thu gom đa điểm**: AI quét toàn bộ các nông hộ nhỏ lẻ trong cùng một vùng địa lý có sản lượng thu hoạch trùng khớp với cửa sổ thời gian của Doanh nghiệp.
* **Đồng nhất chất lượng**: Hệ thống tích hợp dữ liệu kiểm định chứng nhận và nhật ký canh tác để đảm bảo các lô hàng thành phần có phẩm cấp đồng đều.
* **Tạo Lô hàng Hợp nhất (Consolidated Mega-Batch)**: Gom các lô lẻ thành 1 đơn vị phân bổ duy nhất. Doanh nghiệp chỉ cần làm việc trên một hợp đồng và một lịch trình thu gom logistics tập trung tại Điểm tập kết vùng (Agri-Hub), giảm thiểu chi phí quản lý giao dịch lẻ.

---

## 3. Đấu Giá Nông Sản Chưa Thu Hoạch & Đặt Hàng Trước (Pre-Harvest Bidding & Pre-Order)

### Q5: Doanh nghiệp tham gia phiên Đấu giá Hợp đồng Tương lai (Pre-Harvest Bidding) như thế nào?

Doanh nghiệp có thể thu mua trước các lô hàng còn đang phát triển trên vườn (chưa thu hoạch) thông qua phòng Đấu giá thời gian thực (`Live Bidding Room`):

1. **Truy cập Phòng đấu giá**: Chọn phiên đấu giá lô hàng chưa thu hoạch mong muốn dựa trên thông tin loại cây, ngày thu hoạch dự kiến, giá khởi điểm (`Base Price`) và hình ảnh/video thực địa do nông dân cập nhật.
2. **Nạp giá thời gian thực (`Real-time Bidding`)**: Đặt giá dạm mua (Bid) cạnh tranh thông qua kết nối WebSocket thời gian thực. Mỗi lượt nạp giá mới phải cao hơn giá hiện tại tối thiểu một bước giá quy định.
3. **Khóa cọc tham gia**: Để đảm bảo tính nghiêm túc, hệ thống yêu cầu Doanh nghiệp ký quỹ/khóa cọc một khoản tiền định trước qua Cổng thanh toán trước khi quyền ra giá được kích hoạt.
4. **Chốt phiên & Sinh hợp đồng**: Người mua trả giá cao nhất khi hết thời gian đếm ngược sẽ thắng thầu. Hệ thống tự động chuyển trạng thái đơn hàng và khởi tạo Hợp đồng Bao tiêu Tương lai B2B (`Forward Contract`).

### Q6: Chỉ số Điểm Tin Cậy Năng Suất (`Yield Confidence Score`) giúp Doanh nghiệp đánh giá rủi ro ra sao?

Khi tham gia đấu giá lô hàng chưa thu hoạch, rủi ro lớn nhất của Doanh nghiệp là sản lượng thực tế khi hái không đạt như cam kết ban đầu. Hệ thống giải quyết bài toán này bằng chỉ số **Điểm Tin Cậy Năng Suất (Yield Confidence Score)** do AI tính toán:

* **Phân tích Ảnh vệ tinh**: AI sử dụng dữ liệu ảnh vệ tinh chỉ số xanh (`Sentinel-2 NDVI`) để đánh giá sức khỏe vòm cây, mật độ tán lá và diện tích vùng trồng thực tế.
* **Dữ liệu Khí hậu & Mùa vụ**: Kết hợp dữ liệu bức xạ mặt trời, lượng mưa lịch sử (`NASA POWER`, `ERA5`) và nhật ký canh tác của nông hộ.
* **Cung cấp điểm số công khai**: Điểm tin cậy (từ 0.0 đến 1.0 hay 0% - 100%) được hiển thị trực tiếp trên thẻ đấu giá. Điểm số càng cao phản ánh năng suất dự báo càng đáng tin cậy, giúp Doanh nghiệp ra quyết định ra giá chính xác và an toàn.

### Q7: Chức năng Đặt hàng trước (`Pre-Order Booking`) hoạt động như thế nào và quy định tiền cọc ra sao?

Khác với đấu giá cạnh tranh, **Đặt hàng trước** cho phép Doanh nghiệp chốt giữ nguồn hàng chưa thu hoạch với **mức giá niêm yết cố định**:

* **Quy trình đặt trước**: Doanh nghiệp chọn số lượng cần mua trước trên lô hàng `PRE_HARVEST` có bật tính năng Pre-order \\(\rightarrow\\) Xác nhận đơn giá niêm yết \\(\rightarrow\\) Kích hoạt lệnh giữ cọc.
* **Quy định Tiền cọc (Deposit Lock)**: Doanh nghiệp thanh toán khoản tiền cọc cố định (thường từ 20% tổng giá trị đơn hàng) qua Cổng thanh toán tích hợp. Khoản cọc này được hệ thống phong tỏa an toàn cho đến khi bàn giao hàng.
* **Theo dõi Cột mốc Thu hoạch (`Harvest Milestones`)**: Doanh nghiệp trực tiếp xem nhật ký cập nhật hình ảnh/video các giai đoạn phát triển (bọc trái, thử độ đường, hái mẫu) do nông dân tải lên ứng dụng trước ngày giao hàng.

---

## 4. Cơ Chế Khóa Giữ Hàng Tạm Thời & Thanh Toán (Redis Redlock & Holding Payment)

### Q8: Cơ chế Khóa giữ hàng tạm thời đếm ngược (Redis Redlock 15 phút) bảo vệ Người mua khỏi tình trạng trùng đơn (`Overbooking`) ra sao?

Trong giao dịch nông sản tươi B2B thời gian thực, việc nhiều Doanh nghiệp cùng bấm chọn mua 1 lô hàng chất lượng cao tại cùng một giây có thể gây ra tranh chấp tồn kho (`Race Condition`). Hệ thống xử lý triệt để bằng cơ chế **Redis Distributed Lock (Redlock)**:

1. **Khóa tức thì (Instant Reservation)**: Ngay khi Doanh nghiệp bấm "Đặt giữ hàng" hoặc trúng thầu, hệ thống tạo một khóa phân tán độc quyền trên kho bộ nhớ Redis cho đúng số lượng sản phẩm đó.
2. **Đếm ngược TTL 15 phút**: Màn hình Doanh nghiệp hiển thị đồng hồ đếm ngược 15 phút. Trong suốt thời gian này, số lượng hàng đã chọn bị phong tỏa hoàn toàn — không một người mua nào khác trên toàn hệ thống có thể tiếp cận hay đặt trùng.
3. **Xác nhận thanh toán / Giải phóng khóa**:
   * Nếu Doanh nghiệp hoàn tất xác nhận thanh toán/đặt cọc trong 15 phút, đơn hàng chuyển sang trạng thái `CONFIRMED` chính thức.
   * Nếu hết 15 phút mà Doanh nghiệp không hoàn tất thao tác, hệ thống tự động giải phóng khóa (TTL Expire) và hoàn trả số lượng hàng về bể khả dụng (`AVAILABLE pool`) cho thị trường.

### Q9: Chính sách hủy cọc và tịch thu cọc áp dụng khi Người mua hoặc Người bán vi phạm hợp đồng?

Để đảm bảo kỷ luật giao dịch B2B, chính sách xử lý hủy đơn và tiền cọc được quy định minh bạch:

| Trường hợp Vi phạm | Bên vi phạm | Hình thức Xử lý & Tịch thu Cọc |
| :--- | :--- | :--- |
| **Người mua tự ý hủy đơn** sau khi đã chốt Đặt hàng trước / Trúng đấu giá. | Buyer | **Tịch thu 100% tiền cọc**. Tiền cọc được chuyển đền bù cho Nông dân để bù đắp chi phí giữ hàng và rủi ro trễ mùa vụ. |
| **Người bán (Nông dân) tự ý hủy đơn** hoặc bán bẻ cọc cho bên ngoài. | Farmer | **Tịch thu 100% tiền cọc ký quỹ** của Nông dân (hoặc trừ điểm uy tín/khóa tài khoản) và **hoàn trả 200% tiền cọc** cho Doanh nghiệp (hoàn cọc + tiền phạt). |
| **Hủy đơn do Thiên tai / Bất khả kháng** (Lũ lụt, dịch bệnh được chính quyền công bố). | Bất khả kháng | **Hoàn trả 100% tiền cọc** cho Doanh nghiệp. Hai bên không bị phạt điểm uy tín. |
| **Sản lượng thực tế giao hụt quá dung sai PACA** (>10%) mà không có thỏa thuận trước. | Farmer | Doanh nghiệp có quyền từ chối nhận phần hụt hoặc hủy đơn, Nông dân chịu phạt vi phạm hợp đồng theo quy chế. |

---

## 5. Nghiệm Thu Chất Lượng, Tiêu Chuẩn Tươi & Khiếu Nại (Inspection & Dispute)

### Q10: Quy trình kiểm định chất lượng và áp dụng Khung dung sai PACA tại mốc bàn giao diễn ra thế nào?

Tại thời điểm xe logistics cập kho nhận hàng của Doanh nghiệp, quy trình nghiệm thu phẩm cấp được thực hiện nghiêm ngặt theo **Khung dung sai PACA (Perishable Agricultural Commodities Act)**:

1. **Kiểm tra ngoại quan & Cân đối chứng**: Đại diện Doanh nghiệp cùng tài xế đồng kiểm số lượng khay/thùng, cân khối lượng thực tế và kiểm tra tem niêm phong/mã QR lô hàng.
2. **Áp dụng Tỷ lệ Dung sai Khuyết tật**:
   * **Mức chấp nhận chuẩn (Dung sai <= 5%)**: Lô hàng được coi là đạt chuẩn 100%, Doanh nghiệp xác nhận nghiệm thu đủ và kích hoạt thanh toán.
   * **Mức giảm trừ giá (Dung sai 5% - 10%)**: Tỷ lệ hỏng/dập nhẹ nằm trong khoảng cho phép. Doanh nghiệp nghiệm thu thực nhận và hệ thống tự động khấu trừ giá trị thanh toán tương ứng với phần phần trăm khuyết tật.
   * **Mức vi phạm nghiêm trọng (Dung sai > 10%)**: Doanh nghiệp có quyền lập Biên bản Bất hợp quy số, từ chối nhận lô hàng hoặc yêu cầu kích hoạt luồng xử lý tranh chấp.

### Q11: Nếu hàng giao bị hỏng hóc hoặc suy giảm chất lượng vượt ngưỡng cho phép, Người mua được bảo vệ ra sao?

Khi phát hiện sự cố chất lượng (hàng bị dập nát, hỏng lạnh do xe ngắt máy lạnh, suy giảm phẩm cấp nghiêm trọng), Doanh nghiệp được bảo vệ qua quy trình 3 bước:

1. **Lập Biên bản Bất hợp quy Số (`Digital Discrepancy Report`)**: Trực tiếp trên ứng dụng, Doanh nghiệp chụp ảnh/video minh chứng vị trí hàng lỗi, ghi nhận nhiệt độ thùng xe và số cân hụt.
2. **Đóng băng Tiền thanh toán**: Hệ thống lập tức khóa khoản tiền thanh toán còn lại của đơn hàng trên Cổng thanh toán để bảo vệ tài chính cho Doanh nghiệp.
3. **Phân định trách nhiệm dựa trên Dữ liệu Cảm biến**:
   * Nếu dữ liệu cảm biến IoT trên xe lạnh ghi nhận nhiệt độ bị tăng vọt trong hành trình (vượt ngưỡng 5°C - 8°C): **Đơn vị Logistics chịu trách nhiệm bồi thường**.
   * Nếu nhiệt độ xe lạnh ổn định nhưng hàng bị thối rữa từ ruột do nông dân hái sai kỹ thuật/ủ kín: **Nông dân chịu trách nhiệm đền bù**.
   * Tiền bồi thường được trừ trực tiếp từ quỹ ký quỹ của bên vi phạm để hoàn trả cho Doanh nghiệp.

---

## 6. Vận Tải, Chuỗi Cung Ứng Lạnh & Tương Tác Qua AI Agent

### Q12: Người mua theo dõi hành trình xe lạnh và điều kiện nhiệt độ vận chuyển như thế nào?

Toàn bộ các đơn hàng nông sản tươi trên FARMOSA / FARMORA được vận chuyển qua chuỗi cung ứng lạnh được số hóa toàn diện:

* **Theo dõi vị trí thời gian thực (Real-time GPS Tracking)**: Doanh nghiệp xem trực tiếp vị trí xe tải, vận tốc di chuyển và thời gian dự kiến cập kho (`ETA`) trên bản đồ tương tác.
* **Giám sát Nhiệt độ & Độ ẩm liên tục**: Thiết bị cảm biến IoT gắn trong thùng xe lạnh truyền dữ liệu nhiệt độ (duy trì chuẩn 5°C - 8°C cho trái cây/rau củ tươi) về hệ thống theo chu kỳ từng phút.
* **Cảnh báo Vi phạm Chuỗi lạnh (`Cold-Chain Breach Alert`)**: Nếu nhiệt độ thùng xe vượt ngưỡng an toàn quá 15 phút, hệ thống tự động gửi cảnh báo khẩn cấp cho cả Tài xế, Người mua và Người điều phối để can thiệp kịp thời.

### Q13: Trợ lý AI Tương tác Tự động (`Agentic AI Assistant`) hỗ trợ Doanh nghiệp Mua thao tác nhanh qua Prompt/Giọng nói như thế nào?

Doanh nghiệp có thể sử dụng Trợ lý AI Tương tác Tự động (Agentic AI) để thực hiện chuỗi thao tác thu mua phức tạp chỉ bằng một câu lệnh tự nhiên (văn bản hoặc giọng nói):

* **Ví dụ tìm kiếm & giữ hàng**:
  * *Prompt của Doanh nghiệp*: *"Tìm cho tôi 10 tấn Thanh long VietGAP tại Long An có thời hạn bảo quản trên 5 ngày, chọn giá tốt nhất và giữ hàng cho tôi 15 phút."*
  * *Hành động của AI Agent*: AI tự động gọi API `Elasticsearch Geo-search` \\(\rightarrow\\) Lọc chứng nhận VietGAP & chỉ số `TTL > 120h` \\(\rightarrow\\) Sắp xếp giá \\(\rightarrow\\) Tự động kích hoạt `Redis Redlock` giữ hàng và trả về link xác nhận đặt cọc ngay trên giao diện chat.
* **Ví dụ kiểm tra đơn hàng**:
  * *Prompt của Doanh nghiệp*: *"Kiểm tra nhiệt độ xe hàng mã đơn PO-202611-009 đang chạy tới đâu rồi."*
  * *Hành động của AI Agent*: AI truy vấn dữ liệu GPS và cảm biến IoT từ Kafka stream, phản hồi ngay: *"Xe lạnh BKS 63C-123.45 đang cách kho của bạn 18km, ETA 25 phút. Nhiệt độ thùng xe hiện tại ổn định ở 6.2°C."*
