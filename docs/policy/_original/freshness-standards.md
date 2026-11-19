# Quy Chuẩn Chất Lượng & Tiêu Chuẩn Độ Tươi Nông Sản (FARMOSA Freshness & Quality Standards Specification)

Hệ thống điều phối cung – cầu nông sản thời gian thực FARMOSA (Farmora) quản lý nông sản tươi dựa trên bản chất hàng hóa biến đổi theo thời gian (Temporal Inventory). Chất lượng và độ tươi của nông sản tươi không phải là trạng thái cố định mà suy giảm liên tục theo dòng thời gian, điều kiện nhiệt độ kho bãi và vận chuyển. Tài liệu này quy định toàn bộ tiêu chuẩn phẩm cấp, quy trình thẩm định chất lượng, động cơ đếm ngược hạn bảo quản, khung dung sai khuyết tật nghiệm thu và cơ chế tự động điều chuyển giá dựa trên chỉ số rủi ro hư hỏng.

---

## 1. Khung Tiêu Chuẩn Phẩm Cấp & Chứng Nhận Chất Lượng

Để phục vụ bài toán ghép nối đa tiêu chí (Multi-Factor Matching Engine) và tạo niềm tin giao dịch B2B giữa Nông hộ và Doanh nghiệp thu mua, toàn bộ lô nông sản (`Supply Batch`) đăng ký trên hệ thống bắt buộc phải được chuẩn hóa thông tin phẩm cấp và chứng nhận đi kèm.

### 1.1. Hệ Thống Phân Cấp & Chứng Nhận Nông Sản
Nông sản trên hệ thống được phân loại theo các tiêu chuẩn chứng nhận nông nghiệp chính quy và các chỉ số lý-hóa thực tế thu thập tại vườn.

- **Tiêu chuẩn Chứng nhận Nông nghiệp**:
  - **VietGAP / GlobalGAP**: Bắt buộc có mã số vùng trồng được cơ quan có thẩm quyền cấp, chứng nhận quy trình sản xuất an toàn, kiểm soát kim loại nặng và sinh vật gây hại.
  - **Organic (Hữu cơ)**: Yêu cầu chứng nhận từ các tổ chức quốc tế hoặc Việt Nam công nhận, không sử dụng phân bón hóa học và thuốc bảo vệ thực vật tổng hợp.
  - **Phytosanitary (Kiểm dịch thực vật)**: Giấy chứng nhận không mang mầm bệnh quarantine, phục vụ các đơn hàng xuất khẩu hoặc vận chuyển liên vùng.
  - **Pesticide Lab Test (Kiểm định dư lượng)**: Phiếu kết quả phân tích dư lượng thuốc bảo vệ thực vật từ các trung tâm kiểm định độc lập (như Quatest 3, Vinacontrol).

### 1.2. Danh Mục Chỉ Số Thuộc Tính Chất Lượng Lô Hàng
Mỗi lô hàng khi khởi tạo trên bảng điều khiển `Temporal Inventory` phải ghi nhận đầy đủ các thông số chất lượng theo bảng quy chuẩn dưới đây:

| Thuộc tính Chất lượng | Đơn vị / Định dạng | Phương pháp Xác thực | Phạm vi Áp dụng |
| :--- | :--- | :--- | :--- |
| **Mã số Vùng trồng (PUC)** | Chuỗi ký tự chuẩn hóa | Tích hợp Cục Trồng trọt / Sở NN&PTNT | Lô hàng VietGAP / GlobalGAP / Xuất khẩu |
| **Độ trưởng thành / Độ đường (Brix)** | Độ Brix (°Bx) | Khúc xạ kế cầm tay tại hiện trường | Trái cây (Xoài, Sầu riêng, Dưa hấu, Thanh long) |
| **Độ cứng thịt quả (Firmness)** | $kg/cm^2$ | Lực kế đo độ cứng (Penetrometer) | Nông sản tươi bảo quản lạnh |
| **Tỷ lệ Khuyết tật Ngoại quan** | Phần trăm (%) | Kiểm tra cảm quan / Ảnh chụp AI | Toàn bộ các lô hàng nông sản tươi |
| **Dải Nhiệt độ Bảo quản Cam kết** | Độ C (°C) | Cảm biến IoT / Khai báo nhà xe | Chuỗi cung ứng lạnh (Cold Chain) |

---

## 2. Động Cơ Đếm Ngược Hạn Bảo Quản & Thuật Toán Suy Giảm Chất Lượng

Khác biệt cốt lõi của nền tảng FARMOSA là tích hợp chỉ số thời gian đếm ngược (`Shelf-Life / TTL`) trực tiếp vào cấu trúc dữ liệu của từng lô hàng.

### 2.1. Phương Trình Đếm Ngược Hạn Bảo Quản Rõ Rệt
Thời gian bảo quản còn lại của một lô hàng tại thời điểm $t$ ($TTL(t)$) được tính toán dựa trên ngày giờ thu hoạch thực tế ($t_{harvest}$), thời hạn bảo quản tiêu chuẩn ($TTL_{std}$) và hệ số suy giảm do nhiệt độ môi trường ($k_{temp}$):

$$TTL(t) = TTL_{std} \cdot k_{temp} - (t - t_{harvest})$$

Trong đó:
- $t_{harvest}$: Thời điểm nông hộ hái nông sản tại vườn.
- $TTL_{std}$: Thời gian bảo quản tiêu chuẩn của loại nông sản trong điều kiện tiêu chuẩn ($25^\circ C$, độ ẩm $85\%$).
- $k_{temp}$: Hệ số điều chỉnh nhiệt độ. Nếu vận chuyển bằng xe lạnh chuyên dụng ($5-8^\circ C$), $k_{temp} = 1.8 - 2.2$; nếu vận chuyển bằng xe thường trong thời tiết nắng nóng, $k_{temp} = 0.5 - 0.7$.

### 2.2. Chỉ Số Ưu Tiên Suy Giảm Chất Lượng & Rủi Ro Hư Hỏng (Spoilage Risk Index - SPI)
Mô hình AI dự báo liên tục tính toán Chỉ số Rủi ro Hư hỏng ($SPI$) cho từng lô hàng chưa giao dịch để xếp hạng ưu tiên giải cứu và điều chuyển.

$$SPI = w_1 \cdot \left(1 - \frac{TTL(t)}{TTL_{std}}\right) + w_2 \cdot \left(\frac{t_{transit}}{TTL(t)}\right) + w_3 \cdot (1 - P_{demand})$$

- $t_{transit}$: Thời gian vận chuyển dự kiến từ vùng trồng đến điểm nhận.
- $P_{demand}$: Xác suất tìm thấy người mua phù hợp trong bán kính vận tải khả thi.
- $w_1, w_2, w_3$: Trọng số cấu hình do Quản trị viên thiết lập ($w_1 = 0.4, w_2 = 0.4, w_3 = 0.2$).

### 2.3. Phân Cấp Mức Độ Rủi Ro & Hành Động Hệ Thống

> [!NOTE]
> Khi chỉ số $SPI$ vượt qua các ngưỡng an toàn, hệ thống tự động kích hoạt cảnh báo thời gian thực qua WebSockets lên màn hình Điều phối viên (Coordinator) mà không cần thao tác tải lại trang.

- **Mức An Toàn ($SPI < 0.4$)**: Lô hàng ở trạng thái bình thường, ưu tiên ghép nối chuẩn theo thuật toán FEFO (First Expire, First Out).
- **Mức Cảnh Báo ($0.4 \le SPI < 0.7$)**: Phát thông báo màu vàng đến Nông hộ và Điều phối viên. Tự động mở rộng bán kính tìm kiếm người mua trên Elasticsearch Geo-distance thêm $50\ km$.
- **Mức Khẩn Cấp ($SPI \ge 0.7$)**: Phát cảnh báo đỏ (Red Alert). Kích hoạt luồng **Giải cứu Chủ động (Proactive Rescue)**, đề xuất hạ phẩm cấp, giảm giá tự động hoặc chuyển hướng sang nhà máy chế biến sâu.

---

## 3. Quy Trình Thẩm Định & Kiểm Định Hiện Trường

Để khắc phục khoảng trống niềm tin và tình trạng bất đối xứng thông tin chất lượng giữa người bán và người mua, FARMOSA triển khai cơ chế xác thực chất lượng 3 tầng độc lập.

```
[ Tầng 1: Nông hộ Tự Khai báo ] ──► [ Tầng 2: Kiểm định Hiện trường Field Ops ] ──► [ Tầng 3: Chứng nhận Độc lập Third-Party ]
```

### 3.1. Chi Tiết Các Tầng Kiểm Định Chất Lượng

1. **Tầng 1 - Nông hộ Tự Khai báo (Self-Declaration)**:
   - Nông hộ nhập thông tin sản lượng, ngày thu hoạch, chứng nhận và ảnh chụp thực địa khi tạo lô hàng (`UC-B01`).
   - Mọi khai báo được lưu vết cố định trong `Audit Log`. Khai báo sai lệch dẫn đến bị trừ điểm uy tín (Credit Rating) và phạt cọc khi xảy ra tranh chấp.

2. **Tầng 2 - Đơn vị Vận hành Hiện trường (Field Ops & QC Host)**:
   - Đội ngũ kỹ thuật viên hoặc Hợp tác xã liên kết trực tiếp kiểm tra thực địa, đo độ đường (Brix), độ cứng và đối chiếu mã số vùng trồng.
   - Khi lô hàng đạt chuẩn, đơn vị QC cấp nhãn **"Tick Xanh Xác Thực"** trên ứng dụng, giúp lô hàng tăng $30\%$ điểm ưu tiên ghép nối ($Matching\ Score$).

3. **Tầng 3 - Tổ chức Kiểm định Độc lập (Third-Party Inspection Host)**:
   - Áp dụng cho các đơn hàng B2B giá trị lớn hoặc lô hàng đấu giá hợp đồng tương lai.
   - Các tập đoàn giám định độc lập (như Vinacontrol, Control Union, SGS) thực hiện lấy mẫu xét nghiệm dư lượng hóa chất, cấp chứng thư giám định chính thức đính kèm vào hồ sơ lô hàng.

---

## 4. Giám Sát Chuỗi Cung Ứng Lạnh & Điểm Bàn Giao Logistics

Chất lượng nông sản tươi trong quá trình trung chuyển phụ thuộc vào việc duy trì liên tục chuỗi cung ứng lạnh (Cold Chain) và các mốc bàn giao có bằng chứng.

### 4.1. Quy Định Mốc Bàn Giao & Chuyển Giao Rủi Ro (Transfer of Risk)
Theo quy định pháp lý và quy chế vận hành nền tảng, quá trình luân chuyển hàng hóa trải qua các mốc bàn giao bắt buộc phải lưu vết:

1. **Mốc Bốc Hàng tại Vườn (Pickup & Handover)**:
   - Tài xế và Nông hộ cùng thực hiện cân khối lượng thực tế và chụp ảnh tình trạng niêm phong lô hàng.
   - Xác nhận mã QR điện tử trên ứng dụng di động tài xế. Tải sản phẩm và rủi ro bảo quản chính thức chuyển giao từ Nông hộ sang Đơn vị Vận tải (`Transfer of Risk`).

2. **Giám sát Viễn trắc trong Vận chuyển (In-Transit Telematics)**:
   - Đội xe kho lạnh phải duy trì kết nối cảm biến nhiệt độ và tọa độ GPS truyền về hệ thống với chu kỳ tối đa $15$ phút/lần.
   - Dải nhiệt độ chuẩn bắt buộc duy trì: $5^\circ C - 8^\circ C$ đối với rau củ quả tươi tiêu chuẩn; $10^\circ C - 13^\circ C$ đối với trái cây nhạy cảm nhiệt độ thấp (như Xoài, Chuối).

3. **Mốc Giao Hàng tại Kho Người Mua (Delivery & Receipt)**:
   - Tài xế và Người mua mở niêm phong, kiểm tra nhiệt độ thùng xe lúc mở cửa và cân lại khối lượng.
   - Mốc này kích hoạt mở **Cửa sổ Nghiệm thu Khẩn cấp** ($8$ giờ làm việc).

---

## 5. Quy Chuẩn Nghiệm Thu Khuyết Tật & Khung Dung Sai PACA

FARMOSA áp dụng chuẩn dung sai giao hàng tốt (Good Delivery Standards) dựa trên quy định quốc tế PACA (Perishable Agricultural Commodities Act) để làm căn cứ hòa giải tranh chấp nghiệm thu.

### 5.1. Khung Dung Sai Khuyết Tật Mặc Định khi Giao Hàng
Khi người mua nhận hàng tại điểm giao, nếu lô hàng phát sinh khuyết tật tự nhiên do quá trình trung chuyển, mức dung sai tối đa được chấp nhận mà không bị coi là vi phạm hợp đồng được quy định như sau:

| Loại Khuyết Tật Nông Sản | Dung Sai Tối Đa Cho Phép (%) | Phương Thức Đo Lường & Bằng Chứng | Hành Động Xử Lý |
| :--- | :--- | :--- | :--- |
| **Tổng Khuyết Tật Ngoại Quan** | $\le 10.0\%$ tổng khối lượng | Cân mẫu ngẫu nhiên $10\%$ số thùng | Chấp nhận thanh toán đủ $100\%$ giá trị |
| **Khuyết Tật Nghiêm Trọng (Dập nát, thâm đen)** | $\le 5.0\%$ tổng khối lượng | Chụp ảnh phân loại hiện trường + Biên bản | Trừ tiền tương ứng % vượt quá |
| **Hư Hỏng Nặng / Thối Hỏng (Decay/Rot)** | $\le 1.0\%$ tổng khối lượng | Giám định hình ảnh / QC xác nhận | Bồi thường / Tịch thu cọc bên lỗi |
| **Sai Lệch Khối Lượng Cân (Weight Loss)** | $\le 2.0\%$ (Hao hụt tự nhiên) | So sánh phiếu cân mốc B8 và mốc B10 | Miễn trừ trách nhiệm nếu $\le 2\%$ |

### 5.2. Cửa Sổ Thời Gian Báo Lỗi & Kiểm Định Nghiệm Thu
- **Cửa sổ Báo Lỗi Ban Đầu**: Người mua có tối đa **8 giờ làm việc** kể từ mốc xe tải hạ hàng (`Delivery Timestamp`) để gửi cảnh báo từ chối hoặc yêu cầu trừ tiền trên hệ thống kèm hình ảnh/video bằng chứng.
- **Tự Động Nghiệm Thu (Auto-Acceptance)**: Hết $8$ giờ làm việc mà Người mua không gửi bất kỳ phản hồi hay khiếu nại nào, hệ thống tự động ghi nhận trạng thái **"Nghiệm Thu Thành Công"** ($Fulfilled$) và chuyển hồ sơ sang luồng giải ngân.

---

## 6. Xử Lý Khiếu Nại, Điều Chuyển Giá & Cơ Chế Giảm Giá Theo Thời Gian

Đối với các lô hàng nông sản tiệm cận hạn hết hỏng hoặc gặp sự cố chất lượng phát sinh, hệ thống tích hợp cơ chế tự động điều chỉnh giá để đẩy nhanh tốc độ tiêu thụ.

### 6.1. Cơ Chế Đấu Giá Giảm Giá Theo Thời Gian (Dutch Auction / Real-Time Price Decay)
Đối với các lô hàng chưa có người mua có chỉ số $SPI \ge 0.6$, hệ thống kích hoạt cơ chế giảm giá tự động theo thời gian thực (Dutch Auction):

```
[Giá Khởi Điểm Base Price] ──(Tự động giảm ΔP mỗi 30 phút)──► [Mức Giá Sàn Floor Price] ──► [Chốt Mua Khẩn Cấp]
```

- Mức giá sản phẩm tự động giảm theo từng nấc thời gian dựa trên công thức:
  $$P(t) = \max\left(P_{floor}, P_{base} \cdot \left(1 - \alpha \cdot \frac{t - t_{alert}}{TTL_{remaining}}\right)\right)$$
- Trong đó:
  - $P_{base}$: Giá niêm yết ban đầu của nông dân.
  - $P_{floor}$: Mức giá sàn tối thiểu do nông dân cài đặt (không bán lỗ dưới giá vốn).
  - $\alpha$: Hệ số tốc độ giảm giá ($\alpha = 0.3 - 0.5$).
- **Tương Tác Real-Time**: Mức giá nhảy giảm trực tiếp trên màn hình của tất cả Người mua qua WebSockets. Người mua bấm **"Chốt Mua Tức Thì"** đầu tiên sẽ được hệ thống kích hoạt **Redis Distributed Lock** để giữ lô hàng trong $15$ phút.

### 6.2. Quy Trình Hòa Giải Tranh Chấp & Điểm Uy Tín (Credit Rating)
Khi phát sinh khiếu nại chất lượng vượt dung sai:
1. **Thẩm định Bằng chứng**: Điều phối viên (Coordinator) kiểm tra dữ liệu nhật ký nhiệt độ xe tải, hình ảnh bàn giao mốc B8 và hình ảnh nghiệm thu mốc B10.
2. **Xác định Bên Lỗi**:
   - Nếu nhiệt độ xe tải tăng bất thường $> 12^\circ C$: Lỗi thuộc về **Đơn vị Vận tải** (bồi thường giá trị hư hỏng).
   - Nếu hàng đã dập nát từ mốc B8: Lỗi thuộc về **Nông hộ** (hoàn cọc/giảm giá cho người mua).
   - Nếu xe chạy đúng giờ, nhiệt độ đạt chuẩn nhưng hàng thối hỏng $> 1\%$: Áp dụng quy tắc PACA chia sẻ rủi ro tự nhiên.
3. **Trừ Điểm Uy Tín**: Bên vi phạm cam kết (tự ý hủy đơn, giao sai phẩm cấp, bỏ chuyến) sẽ bị tự động trừ điểm tín nhiệm trên hệ thống ($Credit\ Rating$), làm giảm thứ hạng hiển thị trong các thuật toán Matching và Đấu giá tương lai.
