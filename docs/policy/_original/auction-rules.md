# QUY CHẾ VÀ THỂ LỆ ĐẤU GIÁ NÔNG SẢN TƯƠNG LAI (AUCTION RULES) — HỆ THỐNG FARMOSA / FARMORA

## 1. TỔNG QUAN VÀ MỤC TIÊU VẬN HÀNH

Nền tảng **FARMOSA** (FARMORA) vận hành Phân hệ **Sàn Giao dịch Đấu giá Nông sản Chưa Thu hoạch và Hợp đồng Tương lai (Pre-Harvest Bidding & Forward Contract Auction Platform)** nhằm chuyển đổi phương thức mua bán giao ngay (Spot Market) truyền thống sang mô hình giao dịch hợp đồng bao tiêu dài hạn có xác nhận số.

Chức năng đấu giá được thiết kế nhằm giải quyết bài toán mất cân đối cung – cầu theo thời gian và không gian, triệt tiêu rủi ro "được mùa mất giá" cho nông dân, đồng thời bảo đảm nguồn cung nông sản đạt chuẩn chất lượng (VietGAP, GlobalGAP, Organic) cho doanh nghiệp và chuỗi bán lẻ.

---

## 2. QUY CHẾ THAM GIA VÀ RÀNG BUỘC TÁC NHÂN (PARTICIPANT CONSTRAINTS)

Để bảo đảm tính minh bạch, an toàn tài chính và khả thi vận tải trong các giao dịch đấu giá tương lai, nền tảng áp dụng bộ quy tắc ràng buộc nghiêm ngặt đối với hai nhóm tác nhân chính.

### 2.1. Ràng buộc đối với Nông hộ / Người bán (Seller Constraints)

1. **Xác thực Định danh & Mức độ Uy tín (`IAM / Verified Profile`):**
   - Người bán bắt buộc phải sở hữu tài khoản chính thức đã qua xác thực định danh (Keycloak AuthN/AuthZ qua OAuth2/OIDC).
   - Khai báo đầy đủ thông tin trang trại: Mã số vùng trồng, tọa độ GPS thực tế (hệ thống tự động làm mờ 1–2 km trên bản đồ công khai để bảo vệ quyền riêng tư), diện tích canh tác và các chứng nhận chất lượng hợp lệ (VietGAP, GlobalGAP, Organic...).

2. **Cấu trúc Dữ liệu Lô hàng Chưa Thu hoạch (`Pre-Harvest Batch Attributes`):**
   - Khai báo bắt buộc các tham số định danh lô hàng: Chủng loại/giống nông sản, sản lượng ước tính (khoảng sản lượng tối thiểu – tối đa), ngày thu hoạch dự kiến (`Expected_Harvest_Date`), giá khởi điểm (`Base Price`) và thời gian bảo quản dự kiến sau thu hoạch (`Shelf-life / TTL`).

3. **Ngưỡng Thẩm định AI (`Yield Confidence Score`):**
   - Lô hàng chưa thu hoạch chỉ được duyệt kích hoạt sàn đấu giá khi **chỉ số tin cậy sản lượng do AI dự báo đạt từ 80% trở lên**. 
   - Mô hình AI (CNN-LSTM / LightGBM) tổng hợp phân tích dữ liệu ảnh vệ tinh chỉ số xanh (Sentinel-2 NDVI) và chuỗi dữ liệu khí hậu lịch sử (NASA POWER / ERA5) để xác thực tính khả thi của sản lượng khai báo.

4. **Cam kết Sản lượng & Cập nhật Sự cố Bất khả kháng:**
   - Nông hộ cam kết tuân thủ quy trình canh tác công khai. Trường hợp gặp thiên tai, dịch bệnh hoặc mất mùa bất khả kháng, nông hộ phải gửi cảnh báo sự kiện lên nền tảng trước mốc thu hoạch để AI tính toán lại rủi ro và kích hoạt quy trình bảo hiểm hoặc hủy hợp đồng bảo lưu uy tín.

### 2.2. Ràng buộc đối với Doanh nghiệp / Người mua (Buyer Constraints)

1. **Xác thực Doanh nghiệp & Hồ sơ Nhu cầu (`Verified Business Account`):**
   - Người mua bắt buộc phải là tài khoản Doanh nghiệp, Chuỗi Siêu thị hoặc Thương lái B2B đã được xác thực mã số thuế và giấy phép kinh doanh trên Keycloak.
   - Đã khai báo cấu trúc nhu cầu thu mua (`Demand Profile`) gồm quy chuẩn chất lượng chấp nhận, địa điểm nhận hàng và cửa sổ thời gian giao nhận.

2. **Khóa Cọc Tạm thời qua Redis Lock (`Deposit Holding Constraint`):**
   - Khi bấm ra giá (Bid), tài khoản người mua chịu sự kiểm soát của cơ chế **Redis Distributed Lock (Redlock)** để tạm khóa một khoản tiền cọc thanh toán tại Cổng thanh toán/Ngân hàng liên kết.
   - Người mua ra giá cao nhất thắng thầu nếu tự ý hủy đơn sau khi phiên đấu giá đóng sẽ bị tịch thu khoản tiền cọc và bị trừ điểm tín nhiệm (`Credit Rating`) trên nền tảng.

3. **Cửa sổ Thời gian & Bán kính Logistics Khả thi (`Logistics Feasibility Window`):**
   - Địa điểm nhận hàng của Người mua phải nằm trong bán kính vận tải khả thi (tính bằng thuật toán PostGIS / Elasticsearch Geo-distance) từ vùng trồng, đảm bảo phương tiện vận tải kho lạnh/thường có thể giao hàng đến nơi trong khoảng thời gian bảo quản còn lại (`Shelf-life`) của nông sản.

---

## 3. CÁC PHƯƠNG THỨC ĐẤU GIÁ VÀ THUẬT TOÁN KHỚP LỆNH

Nền tảng FARMOSA áp dụng 2 cơ chế đấu giá chuyên biệt cho từng ngữ cảnh mùa vụ và trạng thái lô hàng.

### 3.1. Đấu giá Ngược Kín Đa Tiêu Chí Chia Đơn (Multi-Factor Reverse Split-Award Auction)

Đây là phương thức đấu giá mặc định cho các lô hàng chưa thu hoạch nhằm bảo vệ nông hộ khỏi bị ép giá sâu và hỗ trợ gom nhiều lô hàng nhỏ cho một đơn hàng thu mua quy mô lớn.

#### A. Hàm Chấm Điểm Đa Tiêu Chí (Multi-Factor Matching Score)
Thay vì chỉ lựa chọn bên chào giá rẻ nhất, hệ thống tính toán điểm tương thích tổng hợp theo công thức:

$$\text{Score} = w_1 \cdot \text{Điểm Giá} + w_2 \cdot \text{Độ Tươi Lúc Tới (FEFO)} + w_3 \cdot \text{Điểm Khoảng Cách} + w_4 \cdot \text{Điểm Uy Tín}$$

Trong đó:
- $\text{Điểm Giá} = 1 - \frac{\text{Giá Chào}}{\text{Giá Trần Công Bố}}$ (Giá chào thấp hơn giá trần nhận điểm cao hơn).
- $\text{Độ Tươi Lúc Tới} = \frac{\text{Thời Gian Bảo Quản Còn Lại Khi Tới Nơi}}{\text{Tổng Thời Gian Bảo Quản Standard}}$.
- $\text{Điểm Khoảng Cách} = 1 - \frac{\text{Khoảng Cách Vận Chuyển}}{\text{Bán Kính Tối Đa Cho Phép}}$.
- $\text{Điểm Uy Tín} = \text{Chỉ số Tín nhiệm Lịch sử của Nông hộ (Chuẩn hóa 0-1)}$.
- Các trọng số $w_1, w_2, w_3, w_4$ do Người mua cấu hình theo mẫu ưu tiên (mặc định: $w_1=0.4, w_2=0.3, w_3=0.2, w_4=0.1$).

#### B. Cơ chế Chia Đơn (Split-Award Allocation)
- Khi một đơn thu mua cần số lượng lớn (ví dụ: 10 tấn) mà không nông hộ nào đáp ứng đủ một mình, thuật toán sắp xếp các giá thầu theo `Score` giảm dần và phân bổ sản lượng theo cơ chế cắt lớp:
  $$\text{Allocated Quantity}_i = \min(\text{Supply Available}_i, \text{Max Limit}_i, \text{Remaining Unfulfilled Quantity})$$
- Tự động dừng phân bổ khi đã đáp ứng trọn vẹn số lượng cần mua. Các thầu bị trượt lập tức được giải phóng khóa cọc tạm thời.

---

### 3.2. Đồng hồ Giảm giá Thời gian thực (Dutch Auction / Real-Time Price Decay)

Phương thức này áp dụng cho các lô hàng tươi đã thu hoạch cận ngày hết hạn bảo quản (`Shelf-life/TTL` ngắn) hoặc lô hàng bị hủy đơn đột xuất trên đường vận chuyển.

1. **Quy tắc Giảm giá Tự động:**
   - Lô hàng được niêm yết tại mức giá trần ban đầu. Càng tiến gần về mốc hết hạn (`TTL countdown`), chỉ số rủi ro hư hỏng (`Spoilage Risk Index`) tăng vọt, hệ thống tự động giảm giá bán (`Real-time Price Decay`) theo chu kỳ mỗi phút.
2. **Chốt đơn tức thì qua Redis Lock:**
   - Mức giá nhảy giảm hiển thị thời gian thực trên màn hình người mua qua WebSockets.
   - Người mua đầu tiên chấp nhận mức giá hiện tại bấm **"CHỐT MUA TỨC THÌ"**, hệ thống khởi tạo **Redis Redlock** giữ hàng trong 1/1000 giây để hoàn tất giao dịch khẩn cấp, ngăn chặn trùng đơn.

---

## 4. QUY TRÌNH VẬN HÀNH PHIÊN ĐẤU GIÁ (END-TO-END WORKFLOW)

### Bước 1: Khai báo & Thẩm định Sản lượng Chưa Thu hoạch
- Nông dân nhập thông tin lô hàng chưa thu hoạch. Mô hình AI kết nối qua Kafka Event Bus kiểm tra dữ liệu viễn thám vệ tinh và khí hậu để cấp điểm `Yield Confidence Score`.

### Bước 2: Khởi tạo Phiên & Phát Lời Mời Thầu
- Người mua tạo nhu cầu thu mua và bấm "Mở phiên Đấu giá Ngược". Hệ thống quét các lô hàng thỏa mãn điều kiện cứng (chủng loại, chứng nhận, khung thời gian) và phát thông báo mời thầu bảo mật tới các nông hộ phù hợp.

### Bước 3: Diễn biến Ra giá & Tạm Khóa Cọc
- Nông dân nhập mức giá chào và khối lượng muốn bán (giữ bí mật với các đối thủ). Hệ thống khởi tạo khóa tạm thời trên Redis (`holding:lot:{lot_id}`) đếm ngược TTL.

### Bước 4: Đóng phiên & Khép Hợp đồng Bao tiêu B2B
- Khi đồng hồ đếm ngược về `00:00`, hệ thống phát sự kiện `Auction_Closed` vào Kafka Topic:
  - **Biz Module (Spring Boot):** Tự động khởi tạo Hợp đồng Bao tiêu Tương lai (`forward_contracts`) ghi nhận vào cơ sở dữ liệu PostgreSQL.
  - **Logistics Coordination Service:** Lập lịch phương tiện vận tải kho lạnh cho đúng mốc ngày thu hoạch thực tế trong tương lai.
  - **Payment Service:** Thực hiện giải phóng tiền cọc cho người trượt thầu và chuyển tiền cọc của người thắng thầu vào tài khoản ký quỹ trung gian (`Escrow`).

---

## 5. QUẢN LÝ RỦI RO, TRANH CHẤP VÀ ĐIỂM TÍN NHIỆM

### 5.1. Quy định Dung sai và Nghiệm thu (PACA Standard)
- Hệ thống áp dụng khung dung sai giao nhận nông sản tươi theo chuẩn quốc tế PACA: Dung sai khuyết tật tự nhiên cho phép tối đa 10% (trong đó tối đa 5% hư nặng và 1% thối hỏng).
- Sau khi xe logistics giao hàng tới điểm nhận, mở **Cửa sổ Nghiệm thu 24 giờ**. Nếu Người mua không gửi phản hồi khiếu nại kèm bằng chứng hình ảnh/kiểm định, hệ thống tự động đánh giá đơn hàng hoàn tất thành công.

### 5.2. Hệ thống Điểm Tín nhiệm (Credit Rating Engine)
- Mọi hành vi hủy cọc vô căn cứ, giao thiếu sản lượng ngoài dung sai cho phép hoặc gian lận chất lượng đều bị trừ điểm uy tín công khai trên nền tảng.
- Tài khoản bị giảm điểm tín nhiệm xuống dưới ngưỡng quy định sẽ bị hạn chế quyền tham gia các phiên đấu giá tương lai hoặc bị khóa tài khoản vĩnh viễn qua IAM Keycloak.
