# ĐIỀU KHOẢN SỬ DỤNG VÀ QUY CHẾ VẬN HÀNH NỀN TẢNG FARMOSA / FARMORA

## 1. MỤC ĐÍCH, PHẠM VI VÀ PHÁP NHÂN ĐIỀU PHỐI

### 1.1. Mục đích và Định vị Nền tảng
Tài liệu này quy định các Điều khoản Sử dụng và Quy chế Vận hành chính thức đối với toàn bộ người dùng tham gia vào nền tảng **FARMOSA** (hoặc tên đăng ký tương đương **FARMORA**). FARMOSA được định vị là một **Hệ điều hành số và Nền tảng Đa bên (Multi-Sided Platform - MSP) Trung lập** chuyên về kết nối và điều phối cung – cầu nông sản tươi theo thời gian thực. 

Khác với các sàn thương mại điện tử mua bán lẻ truyền thống (B2C/C2C Marketplace) chỉ thực hiện các giao dịch đơn lẻ, FARMOSA giải quyết bài toán cốt lõi của chuỗi cung ứng nông sản tươi: sự phân mảnh nguồn cung, tính chất nhạy cảm với thời gian (Perishable & Temporal Inventory), và biến động mùa vụ. Nền tảng tập trung gom các nguồn cung rải rác từ các nông hộ nhỏ lẻ thành các Siêu lô hàng chuẩn hóa (Mega-Batches) nhằm ghép nối tối ưu với cấu trúc nhu cầu thu mua quy mô lớn từ các Doanh nghiệp, Chuỗi Siêu thị, Cơ sở Chế biến và Thương lái B2B.

### 1.2. Pháp nhân Điều phối Trung lập (Platform Orchestrator)
FARMOSA vận hành dưới mô hình **Công ty Công nghệ Điều phối Độc lập và Trung lập**. Đơn vị vận hành nền tảng sở hữu hạ tầng phần mềm, cơ sở dữ liệu dùng chung và động cơ thuật toán (Matching & AI Models), nhưng **không trực tiếp sở hữu hàng hóa, không tự kinh doanh thu mua/bán lại nông sản, không sở hữu đội xe vận tải vật lý và không hoạt động như một tổ chức tín dụng/ví điện tử**.

Vị thế trung lập tuyệt đối này đảm bảo dữ liệu kinh doanh nhạy cảm (như giá chốt thu mua, sản lượng thực tế và đối tác thương mại) của các bên không bị rò rỉ cho các đối thủ cạnh tranh, tạo dựng môi trường hợp tác tin cậy cho tất cả các bên tham gia chuỗi giá trị.

---

## 2. QUY ĐỊNH ĐỊNH DANH VÀ PHÂN QUYỀN TÁC NHÂN (USER ROLES & ELIGIBILITY)

Toàn bộ người dùng truy cập và thực hiện giao dịch trên FARMOSA phải được xác thực danh tính qua Hệ thống Quản lý Định danh Keycloak (Keycloak IAM) hỗ trợ giao thức OAuth2/OIDC, tuân thủ mô hình Kiểm soát Truy cập Dựa trên Thuộc tính và Vai trò (RBAC/ABAC).

| Tác nhân (Role) | Chức năng & Quyền hạn | Điều kiện & Trách nhiệm Tham gia |
| :--- | :--- | :--- |
| **Nông hộ / Hợp tác xã** *(Supplier / Producer)* | Khai báo trang trại, tạo Lô hàng Nông sản (`Supply Batch`), niêm yết Phiên Đấu giá Tương lai (`Pre-Harvest Auction`), thiết lập Đặt hàng trước (`Pre-Order`), cập nhật nhật ký mùa vụ, xác nhận lệnh phân bổ. | Hoàn thành xác thực IAM, khai báo tọa độ GPS vùng trồng, cam kết không bán trùng lặp các lô hàng đang khóa trên hệ thống. |
| **Doanh nghiệp / Người mua** *(Buyer / Retailer)* | Khai báo Cấu trúc Nhu cầu (`Demand Request`), tìm kiếm nguồn hàng đa tiêu chí, tham gia Phòng Đấu giá Trực tuyến, thực hiện khóa cọc tạm thời qua Cổng thanh toán. | Xác thực mã số doanh nghiệp, khai báo địa điểm nhận hàng có cấu trúc, có tài khoản liên kết để thực hiện ký quỹ (Escrow Deposit). |
| **Đơn vị Vận tải** *(Fleet / Logistics)* | Khai báo năng lực đội xe (`Fleet Capacity`), tiếp nhận đơn chở hàng, cập nhật mốc tiến độ (`In-Transit Status`), báo cáo sự cố hành trình. | Khai báo phương tiện (xe thường/xe lạnh), tải trọng đăng kiểm, tuyến đường hoạt động, cam kết duy trì điều kiện nhiệt độ bảo quản. |
| **Người Điều phối Vùng** *(Coordinator)* | Giám sát Bản đồ nhiệt Cung - Cầu vĩ mô (`Macro Heatmap`), phê duyệt phương án ghép nối AI (*Human-in-the-Loop*), kích hoạt Luồng Giải cứu khẩn cấp, hòa giải tranh chấp. | Được phân công bởi Ban Quản trị Nền tảng, tuân thủ quy trình vận hành và nguyên tắc trung lập. |

---

## 3. NGUYÊN TẮC VẬN HÀNH CỐT LÕI VÀ RANH GIỚI TRÁCH NHIỆM (OUT-OF-SCOPE BOUNDARIES)

### 3.1. Ranh giới Trách nhiệm Kỹ thuật số và Thực địa (Out-of-Scope Boundaries)
Để đảm bảo tính khả thi và tuân thủ pháp lý, FARMOSA xác định rõ các ranh giới dịch vụ mà nền tảng **KHÔNG** trực tiếp đảm nhận:
1. **Thanh toán Tài chính Trực tiếp:** FARMOSA không giữ vai trò là ngân hàng, ví điện tử hay trung gian thanh toán thu giữ tiền trực tiếp. Mọi giao dịch đặt cọc, thanh toán công nợ và giải ngân ký quỹ được thực hiện bởi Ngân hàng Thương mại / Cổng thanh toán đối tác (*Financial Host*) tích hợp qua API.
2. **Thực thi Vận tải Vật lý:** FARMOSA cung cấp thuật toán đề xuất tuyến đường và ghép chuyến, nhưng không sở hữu hay trực tiếp điều khiển phương tiện vận chuyển. Việc bốc dỡ, lái xe và duy trì nhiệt độ thực địa thuộc trách nhiệm của Đơn vị Logistics (*Physical Infrastructure Host*).
3. **Thẩm định Chất lượng Chuyên sâu:** FARMOSA lưu trữ và hiển thị các chứng nhận, nhưng việc lấy mẫu xét nghiệm vi sinh, đo độ Brix hay cấp chứng nhận VietGAP/GlobalGAP thuộc trách nhiệm độc lập của các Đơn vị Kiểm định bên thứ ba (*Field Ops & QC Host*).
4. **Quản lý Kỹ thuật Canh tác & Cảm biến IoT:** Nền tảng không điều khiển trực tiếp hệ thống tưới tiêu hay cảm biến tại vườn trồng. Dữ liệu mùa vụ do người dùng tự khai báo và chịu trách nhiệm.

### 3.2. Quy tắc Chuyển giao Rủi ro Hàng hóa (Transfer of Risk)
Tuân thủ **Điều 57 Luật Thương mại 2005 (Việt Nam)** và các thông lệ thương mại nông sản quốc tế:
* **Mặc định:** Rủi ro về mất mát, suy giảm chất lượng hoặc hư hỏng nông sản được chính thức chuyển từ Người bán (Farmer) sang Bên Vận tải hoặc Người mua tại mốc **Bàn giao Vật lý khi Lấy hàng (Pick-up Handover)**, khi các bên đã ký xác nhận biên bản giao nhận và quét mã QR kiểm tra khối lượng/hình ảnh thực tế.
* **Ngoại lệ:** Trường hợp hợp đồng bao tiêu/term sheet giữa hai bên có thỏa thuận riêng về địa điểm giao hàng (ví dụ: giao tại kho Người mua), thời điểm chuyển giao rủi ro sẽ áp dụng theo đúng thỏa thuận ghi nhận trên Term Sheet đã chốt.

---

## 4. QUY TRÌNH QUẢN LÝ LÔ HÀNG VÀ YẾU TỐ THỜI GIAN (TEMPORAL INVENTORY & BATCH RULES)

### 4.1. Quản lý ở Cấp độ Lô hàng (Batch-Level Management Rule)
Nông sản tươi không được quản lý dưới dạng tồn kho tổng tĩnh mà bắt buộc phải quản lý chi tiết theo từng **Lô hàng độc lập (`Supply Batch`)**. Mỗi lô hàng khi khởi tạo phải gắn liền với các thuộc tính thời gian và chất lượng:
$$\text{Supply Batch} = \{\text{Mã Lô, Loại Nông sản, Sản lượng, Vị trí GPS, Ngày hái, Shelf-life (TTL), Phẩm cấp}\}$$

### 4.2. Quy tắc Đếm ngược Thời gian Bảo quản (Shelf-Life Countdown)
Hệ thống tự động thiết lập đồng hồ đếm ngược Thời gian bảo quản còn lại (Functional Shelf-life TTL) cho từng lô hàng dựa trên quy chuẩn sinh học của loại nông sản và ngày thu hoạch thực tế.
* **Quy tắc Ưu tiên Bảo quản (FEFO - First Expire, First Out):** Khi nhiều lô hàng cùng đáp ứng các tiêu chuẩn của một Nhu cầu thu mua, Động cơ Matching sẽ tự động gán trọng số ưu tiên cao hơn cho lô hàng có thời gian bảo quản còn lại ngắn hơn, nhằm nhanh chóng giải tỏa nguồn hàng nhạy cảm thời gian và triệt tiêu nguy cơ thất thoát.
* **Cập nhật Trạng thái Lô hàng:** Trạng thái lô hàng được quản lý theo vòng đời nghiêm ngặt: `PRE_HARVEST` (Chưa thu hoạch) $\rightarrow$ `AVAILABLE` (Sẵn sàng) $\rightarrow$ `HOLDING` (Tạm giữ) $\rightarrow$ `ALLOCATED` (Đã phân bổ) $\rightarrow$ `IN_TRANSIT` (Đang giao) $\rightarrow$ `DELIVERED` (Đã giao) hoặc `EXPIRED` (Hết hạn).

### 4.3. Quản lý Chứng nhận và Tính Toàn vẹn Phẩm cấp
* Nông hộ có quyền đính kèm mã vùng trồng, giấy chứng nhận VietGAP/GlobalGAP, phiếu kiểm định dư lượng thuốc BVTV hoặc hình ảnh thực địa vào hồ sơ Lô hàng.
* Lô hàng có chứng nhận hợp lệ sau khi được xác minh bởi Admin hoặc Đơn vị QC sẽ nhận được nhãn **"Có chứng nhận" (Verified Badge)** và được ưu tiên gán điểm tương thích cao hơn trong thuật toán Matching.

---

## 5. QUY CHẾ ĐẤU GIÁ HỢP ĐỒNG TƯƠNG LAI VÀ ĐẶT HÀNG TRƯỚC (PRE-HARVEST BIDDING & PRE-ORDERS)

### 5.1. Đấu giá Nông sản Chưa Thu hoạch (Pre-Harvest Forward Contract Auction)
Chức năng Đấu giá Tương lai cho phép Nông dân niêm yết các lô nông sản còn trên cây/đồng ruộng chuẩn bị thu hoạch để Doanh nghiệp tham gia đấu giá bao tiêu từ sớm.

1. **Ràng buộc Mở phiên Đấu giá:**
   * Nông hộ phải có tài khoản đã qua xác thực định danh (IAM Verified Profile), khai báo tọa độ trang trại, ngày thu hoạch dự kiến (`Expected_Harvest_Date`), giá khởi điểm (`Base Price`) và nhật ký canh tác.
   * Lô hàng chưa thu hoạch bắt buộc phải trải qua mô hình AI phân tích dữ liệu thời tiết (NASA POWER/ERA5) và ảnh vệ tinh (Sentinel-2 NDVI) để đạt **Chỉ số Tin cậy Sản lượng (`Yield Confidence Score`) từ 80% trở lên**.
2. **Quy chế Diễn biến Đấu giá Trực tuyến:**
   * Phiên đấu giá diễn ra trong thời gian thực qua giao thức WebSockets / SSE.
   * Khi Người mua tham gia ra giá (Bid), hệ thống kích hoạt **Redis Redlock** để tạm khóa một khoản tiền cọc cố định trên tài khoản liên kết của người ra giá cao nhất.
   * Kết thúc đồng hồ đếm ngược, người mua ra giá cao nhất thắng thầu. Sự kiện `Auction_Closed` tự động sinh Hợp đồng Bao tiêu Tương lai (Forward Contract B2B) và đặt trước lịch vận tải cho ngày thu hoạch.

### 5.2. Chức năng Đặt hàng Trước (Pre-Order Booking)
Đối với các giao dịch chốt giá cố định trước mùa thu hoạch:
* Nông dân thiết lập các thông số Đặt trước trên Lô hàng chưa thu hoạch: Giá đặt trước/kg, số lượng đặt tối thiểu, và % Tiền cọc yêu cầu (mặc định 20%).
* Người mua chốt số lượng đặt trước $\rightarrow$ Hệ thống chuyển số lượng tương ứng sang trạng thái tạm khóa $\rightarrow$ Người mua thanh toán cọc qua Cổng thanh toán $\rightarrow$ Đơn chuyển sang `DEPOSITED_CONFIRMED`.
* Nông dân có nghĩa vụ cập nhật các cột mốc nhật ký thu hoạch thực địa (như bọc trái, đạt độ đường, bắt đầu hái) kèm hình ảnh cho người mua theo dõi tiến độ.
* **Xử lý Hủy cọc (Forfeiture Policy):** Nếu Người mua tự ý hủy đơn đặt trước sau khi đã xác nhận cọc, toàn bộ tiền cọc sẽ bị tịch thu chuyển cho Nông dân bồi thường. Nếu Nông dân tự ý hủy đơn hoặc không giao hàng đúng cam kết (ngoài sự cố thiên tai/dịch bệnh được xác nhận), Nông dân phải đền bù cọc theo quy định hợp đồng và bị hạ điểm uy tín nghiêm trọng.

---

## 6. CƠ CHẾ KHÓA GIỮ HÀNG PHÂN TÁN VÀ CHỐNG BÁN TRÙNG (RESERVATION & HOLDING MECHANISM)

### 6.1. Thuật toán Khóa Giữ hàng Phân tán (Redis Redlock Algorithm)
Để ngăn chặn tuyệt đối hiện tượng tranh chấp dữ liệu, quá bán hoặc bán trùng lặp một lô hàng nông sản hot cho nhiều người mua cùng lúc (*Overbooking / Race Conditions*), FARMOSA áp dụng cơ chế khóa phân tán **Redis Distributed Lock (Redlock)** trên bộ nhớ đệm In-memory.

### 6.2. Quy tắc Đếm ngược Tạm giữ (Holding Countdown Rules)
1. Khi Người mua hoặc Người điều phối chọn một phương án phân bổ lô hàng, hệ thống phát lệnh tạo một **Khóa tạm giữ (Holding Lock) đi kèm Thời gian sống (TTL - Time To Live, mặc định 15 phút)**.
2. Trong khoảng thời gian 15 phút đếm ngược:
   * Số lượng nông sản được chọn sẽ chuyển từ `Available` sang `Holding/Reserved`. Các người mua khác sẽ không thể truy cập hoặc chọn mua số lượng này.
   * Nếu hai bên xác nhận Term Sheet và hoàn tất cọc/bảo lãnh thanh toán trong 15 phút, trạng thái chính thức chuyển sang `Allocated`.
   * Nếu hết 15 phút đếm ngược mà không có xác nhận giao dịch thành công, **Redis Keyexpiration Event** sẽ tự động kích hoạt, giải phóng khóa phân tán và lập tức trả số lượng nông sản về trạng thái `Available` cho thị trường mà không gây lệch tồn kho.

---

## 7. QUY TRÌNH ĐIỀU PHỐI LOGISTICS VÀ BÀN GIAO NGHỆM THU (LOGISTICS & ACCEPTANCE)

### 7.1. Đánh giá Tính Khả thi Vận tải (Logistics Feasibility Window)
Thuật toán Matching bắt buộc phải kiểm tra điều kiện khả thi vận tải trước khi đề xuất phương án ghép nối:
$$\text{Thời gian Vận chuyển Dự kiến} + \text{Thời gian Bốc dỡ} \le \text{Thời gian Bảo quản Còn lại (Shelf-life)}$$
Nếu thời gian giao hàng dự kiến vượt quá quỹ thời gian bảo quản tươi còn lại của lô hàng, hệ thống sẽ đánh dấu phương án là "Không khả thi về Logistics" và từ chối khởi tạo đơn.

### 7.2. Chuỗi 4 Mốc Bàn giao Có Bằng chứng (Proof-of-Handoff Chain)
Mọi chuyến vận tải nông sản trên FARMOSA được quản lý qua chuỗi 4 mốc xác nhận minh bạch:
1. **Mốc 1: Chốt Điều khoản (Term Sheet Locked):** Hai bên thống nhất loại hàng, số lượng dung sai, giá chốt, thời gian và địa điểm giao nhận.
2. **Mốc 2: Lấy hàng & Chuyển giao Rủi ro (Pick-up Handover):** Tài xế đến vườn bốc hàng. Nông dân và Tài xế cùng cân khối lượng thực tế, chụp ảnh tình trạng hàng và quét mã QR xác nhận. Rủi ro bảo quản chính thức chuyển sang Bên Vận tải/Bên Mua từ thời điểm này.
3. **Mốc 3: Giám sát Hành trình (In-Transit Monitoring):** Tài xế cập nhật vị trí, mốc tiến độ hoặc báo cáo sự cố (hỏng xe, kẹt xe) qua ứng dụng di động để AI tính toán lại thời gian đến dự kiến (ETA) và điểm rủi ro hư hỏng.
4. **Mốc 4: Nghiệm thu tại Điểm giao (Delivery Acceptance):** Xe đến kho Người mua. Người mua kiểm tra khối lượng, chất lượng và ghi nhận biên bản nghiệm thu trên hệ thống.

### 7.3. Quy chuẩn Dung sai Khuyết tật và Cửa sổ Nghiệm thu (PACA Standards)
Áp dụng tiêu chuẩn lưu thông nông sản tươi quốc tế (PACA Guidelines):
* **Bảng Dung sai Mặc định:** Nếu hợp đồng không có thỏa thuận riêng, mức dung sai khuyết tật tự nhiên áp dụng là **10% tổng khuyết tật phẩm cấp, trong đó tối đa 5% hư hỏng nặng và 1% thối hỏng do vận chuyển**. Các biến động nằm trong ngưỡng dung sai này được coi là giao hàng hợp lệ.
* **Cửa sổ Thời gian Nghiệm thu:** Người mua có trách nhiệm thực hiện kiểm tra và bấm xác nhận "Nghiệm thu Chấp nhận" hoặc "Tạo Khiếu nại" trong vòng **24 giờ làm việc** kể từ mốc xe báo đến điểm giao.
* **Quy tắc Tự động Chấp nhận (Auto-Acceptance Rule):** Nếu hết cửa sổ 24 giờ mà Người mua im lặng và không tạo khiếu nại bằng văn bản kèm ảnh chứng cứ, hệ thống sẽ **tự động chuyển trạng thái đơn hàng thành `COMPLETED` (Hoàn tất)** và giải tỏa toàn bộ tiền bảo lãnh/ký quỹ cho Người bán.

---

## 8. CHÍNH SÁCH BẢO MẬT BẢO VỆ TỌA ĐỘ VÙNG TRỒNG (GEOSPATIAL LOCATION PRIVACY)

### 8.1. Cơ chế Làm mờ Tọa độ Vùng trồng (Geospatial Location Obfuscation)
Để bảo vệ quyền riêng tư cá nhân của nông dân và ngăn chặn tình trạng thương lái tự ý đến tận vườn ép giá ép hợp đồng bên ngoài nền tảng, FARMOSA áp dụng thuật toán làm mờ vị trí không gian:
* **Bản đồ Công khai (Public Map):** Mọi lô hàng hiển thị trên giao diện tìm kiếm/bản đồ công khai sẽ **chỉ hiển thị Tọa độ Mờ (`obfuscated_location`)** được hệ thống tự động tạo ra bằng cách gán bán kính ngẫu nhiên lệch từ **1,0 km đến 2,0 km** so với trang trại thực tế.
* **Bảo vệ Thông tin Liên hệ:** Số điện thoại, địa chỉ cụ thể và tọa độ gốc của Nông dân được ẩn danh hoàn toàn đối với người truy cập công khai.

### 8.2. Điều kiện Giải mã Tọa độ Chính xác (Precision Unlocking Protocol)
Tọa độ GPS chính xác (`location`) và số điện thoại liên hệ của Nông dân chỉ được hệ thống tự động giải mã và chia sẻ riêng cho **Bên Mua và Tài xế Vận tải đảm nhận** sau khi:
1. Phiên đấu giá đã kết thúc thành công và hợp đồng bao tiêu được khởi tạo; HOẶC
2. Đơn đặt hàng trước / Đơn phân bổ đã được nộp cọc/bảo lãnh thanh toán thành công qua Cổng thanh toán.

---

## 9. GIÁM SÁT RỦI RO, GIẢI CỨU CHỦ ĐỘNG VÀ HÒA GIẢI TRANH CHẤP (PROACTIVE RESCUE & DISPUTES)

### 9.1. Bảng Chỉ số Rủi ro Hư hỏng (Spoilage Risk Index - SPI)
Mô hình Machine Learning ngầm (Python Service) kết nối qua Kafka Event Stream liên tục tính toán Chỉ số Rủi ro Hư hỏng (Spoilage Risk Index - SPI) cho từng lô hàng dựa trên: ngày thu hoạch, điều kiện lưu kho, thời gian vận chuyển thực tế và khả năng tìm được người mua đối ứng.

### 9.2. Luồng Giải cứu Chủ động (Proactive Rescue Workflow)
Khi chỉ số SPI của một lô hàng vượt ngưỡng an toàn (mức Báo động Đỏ) hoặc vùng trồng có nguy cơ dư cung cục bộ, hệ thống không thụ động chờ nông sản thối hỏng mà tự động kích hoạt **Luồng Giải cứu Chủ động**:
1. **Gợi ý Hạ giá Bán Chiết khấu:** AI tự động đề xuất mức giảm giá theo thời gian thực (Time-Decay Pricing) để kích thích các bên thu mua tiêu thụ nhanh.
2. **Điều chuyển Luồng Chế biến Sâu:** Hệ thống quét bán kính vị trí và gợi ý chuyển hướng xe tải sang các Nhà máy Sơ chế / Chế biến Sâu (sấy khô, đóng hộp, làm nước ép) gần nhất.
3. **Kích hoạt Kênh Giải cứu / Từ thiện:** Kết nối thông tin với các quỹ từ thiện, tổ chức xã hội để phân phối nông sản trước khi sản phẩm bị mất toàn bộ giá trị thương mại.
* **Nguyên tắc Con người Phê duyệt (Human-in-the-Loop):** Mọi đề xuất giải cứu từ AI bắt buộc phải được **Người Điều phối Vùng (Coordinator) thẩm định và phê duyệt** trước khi phát lệnh thực thi đến các bên liên quan.

### 9.3. Cơ chế Hòa giải Tranh chấp (Dispute Resolution Procedure)
* Trường hợp phát sinh khiếu nại về chất lượng/khối lượng khi giao nhận, Người mua phải tải lên biên bản kiểm tra kèm ảnh bằng chứng rõ ràng trong Cửa sổ Nghiệm thu 24 giờ.
* Người Điều phối Vùng đóng vai trò là **Trọng tài Hòa giải trung lập (Neutral Arbitrator)**, đối chiếu nhật ký giao dịch (`Audit Logs`), dữ liệu 4 mốc bàn giao và kết quả kiểm định QC độc lập để đưa ra phán quyết điều chỉnh giá, xử lý đền bù hoặc giải tỏa một phần quỹ cọc ký quỹ.
* Phán quyết của Người điều phối mang tính chất chế tài hệ thống (ảnh hưởng đến Điểm Uy tín và Quyền truy cập Nền tảng của các bên).

---

## 10. HỆ THỐNG ĐIỂM UY TÍN, XỬ LÝ VI PHẠM VÀ CHẤM DỨT TƯ CÁCH THÀNH VIÊN

### 10.1. Hệ thống Đánh giá Điểm Uy tín (Credit Rating System)
FARMOSA duy trì Chỉ số Uy tín (Credit Rating Score, thang điểm 0 - 100) cho tất cả các tài khoản Nông dân, Người mua và Đơn vị Vận tải. Điểm uy tín được tính toán tự động dựa trên:
* Tỷ lệ hoàn thành đơn hàng đúng cam kết (+).
* Độ chính xác của thông tin khai báo sản lượng/chất lượng (+).
* Lịch sử đánh giá (Rating) từ các đối tác sau mỗi giao dịch thành công (+).

### 10.2. Chế tài Xử lý Vi phạm (Penalties & Violations)

| Hành vi Vi phạm | Chế tài Xử lý & Phạt Uy tín |
| :--- | :--- |
| **Bán tuồn / Tự ý bán lô hàng đang ở trạng thái Khóa (`Reserved/Allocated`)** | Trừ 30 điểm uy tín, tịch thu tiền cọc (nếu có), tạm đình chỉ quyền đăng bán 30 ngày. |
| **Hủy đơn hàng / Hủy phiên đấu giá sau khi đã chốt hợp đồng (ngoài bất khả kháng)** | Tịch thu toàn bộ tiền cọc ký quỹ, trừ 40 điểm uy tín, công khai lịch sử hủy đơn. |
| **Khai báo sai lệch phẩm cấp / Giả mạo chứng nhận chất lượng** | Trừ 50 điểm uy tín, gỡ nhãn Verified, yêu cầu bồi thường chi phí kiểm định lại. |
| **Tự ý hủy chuyến / Bỏ chuyến vận tải của Đơn vị Logistics** | Trừ 30 điểm uy tín nhà xe, bồi thường chi phí phát sinh điều xe thay thế. |
| **Tài khoản có Điểm Uy tín dưới 40 điểm** | Tự động hạ thứ hạng ưu tiên trong Động cơ Matching, khóa quyền tham gia Đấu giá. |
| **Tài khoản có Điểm Uy tín dưới 20 điểm / Tái phạm nghiêm trọng** | **Khóa tài khoản vĩnh viễn (Permanent Suspension)**, đưa vào danh sách đen (Blacklist). |

### 10.3. Tuân thủ Pháp lý và Cập nhật Điều khoản
FARMOSA có quyền cập nhật, bổ sung các nội dung trong Điều khoản Sử dụng này để đáp ứng các quy định pháp luật hiện hành (như Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân tại Việt Nam) và thực tiễn vận hành thị trường. Các thay đổi lớn sẽ được thông báo trước ít nhất 15 ngày trên giao diện nền tảng trước khi chính thức áp dụng.

---
*Tài liệu Điều khoản Sử dụng và Quy chế Vận hành FARMOSA / FARMORA có hiệu lực áp dụng kể từ ngày ban hành.*
