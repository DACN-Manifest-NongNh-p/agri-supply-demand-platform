# Hướng Dẫn & Hỏi Đáp Nghiệp Vụ Dành Cho Nông Dân và Hợp Tác Xã (Producer FAQ)

Tài liệu này cung cấp toàn bộ giải đáp chi tiết về cơ chế vận hành, quy trình giao dịch, bảo mật quyền riêng tư và các công cụ hỗ trợ thông minh trên Nền tảng Điều phối Cung – Cầu Nông sản Thời gian thực FARMOSA (FARMORA).

---

## 1. Tổng Quan Về Nền Tảng FARMOSA / FARMORA

### FARMOSA là gì và có điểm gì khác biệt so với thương lái truyền thống hay sàn thương mại điện tử?
FARMOSA không phải là đơn vị thu mua nông sản hay sàn bán lẻ điện tử thông thường, mà là nền tảng kết nối và điều phối cung – cầu nông sản B2B theo thời gian thực. Hệ thống giúp nông dân và hợp tác xã trực tiếp tiếp cận mạng lưới siêu thị, nhà bán lẻ, doanh nghiệp xuất khẩu và nhà máy chế biến mà không phải phụ thuộc hoàn toàn vào thương lái địa phương.

Khác với các sàn thương mại điện tử chỉ niêm yết sản phẩm tĩnh, FARMOSA quản lý nông sản theo từng lô hàng gắn liền với đồng hồ đếm ngược thời gian bảo quản (Shelf-life/TTL). Hệ thống tích hợp trí tuệ nhân tạo (AI) để chủ động ghép nối đa tiêu chí, tự động gom nhiều lô hàng nhỏ thành đơn hàng lớn và cảnh báo sớm nguy cơ ứ đọng để tìm đầu ra tiêu thụ kịp thời trước khi nông sản bị giảm chất lượng.

### Tôi có phải nộp phí đăng bài hay chia sẻ doanh thu trực tiếp trên nền tảng không?
Nông dân và hợp tác xã được đăng ký tài khoản, khai báo vùng trồng và niêm yết các lô hàng hoàn toàn miễn phí trên nền tảng. FARMOSA vận hành theo mô hình kết nối trung lập, không thu tiền mua bán trực tiếp của nông dân.

Nguồn thu của nền tảng đến từ phí dịch vụ phần mềm quản lý nâng cao đối với doanh nghiệp thu mua lớn, phí kết nối hạ tầng vận tải từ các đơn vị logistics và phí cung cấp báo cáo phân tích thị trường vĩ mô. Do đó, bà con nông dân được hưởng trọn vẹn giá trị thương lượng thực tế của lô hàng.

### Làm thế nào để đảm bảo thông tin cá nhân và vị trí trang trại của tôi không bị thương lái tìm đến ép giá riêng lẻ?
FARMOSA áp dụng cơ chế làm mờ tọa độ vùng trồng (Location Obfuscation) tự động để bảo vệ quyền riêng tư và lợi thế thương lượng cho nông hộ.

1. **Bản đồ công khai**: Khi lô hàng được đăng tải, hệ thống chỉ hiển thị vị trí của trang trại dưới dạng một bán kính mờ ngẫu nhiên từ 1 đến 2 km. Thương lái hoặc người mua trên bản đồ chung không thể nhìn thấy tọa độ GPS chính xác hay số nhà của bà con.
2. **Giải mã tọa độ chính xác**: Tọa độ GPS chính xác và thông tin liên hệ trực tiếp chỉ được hệ thống tự động giải mã và gửi riêng cho Bên mua và Tài xế vận tải sau khi giao dịch đã được chốt chính thức và khoản tiền cọc/bảo lãnh thanh toán đã được khóa an toàn.

---

## 2. Tạo & Quản Lý Lô Hàng Theo Thời Gian (Temporal Batch Management)

### Quản lý theo lô (Supply Batch) là gì và tại sao tôi không thể nhập tổng sản lượng chung chung?
Nông sản tươi có tính biến động cao và mỗi đợt hái đều có thời điểm thu hoạch, độ chín và hạn bảo quản khác nhau. Quản lý theo lô (Batch-Level Management) là việc mã hóa từng đợt thu hoạch thành một hồ sơ lô hàng riêng biệt kèm mã ID duy nhất.

Việc quản lý theo lô mang lại 3 lợi ích cốt lõi cho nông dân:
- **Xác định chính xác hạn sử dụng**: Mỗi lô có đồng hồ đếm ngược thời gian bảo quản riêng, giúp hệ thống ưu tiên đẩy bán các lô hái trước theo quy tắc FEFO (First Expire, First Out - Hàng hết hạn trước xuất trước).
- **Tránh nhầm lẫn phẩm cấp**: Nông dân dễ dàng phân loại lô đạt chuẩn VietGAP/GlobalGAP với các lô thông thường để bán đúng giá trị.
- **Tối ưu hóa phân bổ**: Giúp hệ thống tự động cắt trừ đúng số lượng đã bán mà không ảnh hưởng đến lượng nông sản còn lại trên vườn.

### Quy trình khởi tạo lô hàng và đính kèm chứng nhận chất lượng được thực hiện như thế nào?
Bà con nông dân có thể tạo lô hàng mới trên ứng dụng di động theo các bước hướng dẫn sau:

1. **Truy cập mục Lô hàng**: Chọn nút **"Tạo lô mới"** trên ứng dụng di động.
2. **Nhập thông tin bắt buộc**:
   - Loại nông sản và giống cây trồng (ví dụ: Xoài Cát Hòa Lộc, Thanh Long ruột đỏ).
   - Sản lượng thực tế hoặc sản lượng dự kiến thu hoạch (kg hoặc tấn).
   - Vị trí vùng trồng/điểm tập kết nông sản.
   - Ngày giờ thu hoạch thực tế hoặc dự kiến.
   - Khung thời gian có thể giao hàng.
3. **Đính kèm chứng từ & Hình ảnh**:
   - Tải lên ảnh chụp thực địa vườn cây hoặc nông sản sau khi hái.
   - Tải lên file ảnh/PDF chứng nhận VietGAP, GlobalGAP, Organic hoặc phiếu kiểm định dư lượng thuốc bảo vệ thực vật.
4. **Xác nhận lưu**: Bấm **"Lưu lô hàng"**. Hệ thống sẽ tự động cấp mã lô duy nhất và kích hoạt bộ đếm thời gian bảo quản. Các lô có chứng nhận sẽ được gắn nhãn **"Có chứng nhận"** để ưu tiên hiển thị cho các siêu thị lớn.

### Thời gian bảo quản còn lại (Shelf-life/TTL) được tính như thế nào và tại sao nó quan trọng?
Thời gian bảo quản còn lại được hệ thống tự động tính toán từ thời điểm thu hoạch kết hợp với thời gian lưu trữ tiêu chuẩn của từng loại nông sản do bộ quy tắc hệ thống cấu hình.

$$\text{Thời gian bảo quản còn lại} = \text{Ngày thu hoạch} + \text{Thời hạn tiêu chuẩn} - \text{Thời điểm hiện tại}$$

Chỉ số này đóng vai trò quyết định trong việc xếp hạng ưu tiên ghép nối. Khi hai lô hàng cùng đáp ứng yêu cầu của người mua, lô hàng có thời gian bảo quản còn lại ngắn hơn sẽ được thuật toán ưu tiên đẩy lên đầu danh sách đề xuất để tránh rủi ro hư hỏng.

### Nếu sản lượng thực tế sau khi hái ít hơn hoặc nhiều hơn số lượng đã đăng thì xử lý ra sao?
Nông dân có quyền cập nhật thông tin lô hàng bất kỳ lúc nào trước khi lô hàng chuyển sang trạng thái đã giao.

| Trường hợp | Hướng xử lý của hệ thống |
| :--- | :--- |
| **Sản lượng thực tế nhiều hơn** | Nông dân vào mục "Cập nhật lô hàng" và nhập số lượng tăng thêm. Phần sản lượng thừa sẽ tự động đưa vào danh mục sẵn bán (`Available`) cho các đơn hàng khác. |
| **Sản lượng thực tế ít hơn (chưa chốt đơn)** | Nông dân nhập số lượng giảm thực tế. Hệ thống cập nhật lại tổng cung mà không phát sinh bất kỳ chế tài nào. |
| **Sản lượng thực tế ít hơn (đã chốt đơn)** | Nếu sản lượng giảm làm ảnh hưởng đến số lượng đã cam kết với người mua, hệ thống sẽ phát cảnh báo. Nông dân nhập lý do thực tế (thiên tai, sâu bệnh). Hệ thống sẽ thông báo cho Bên mua và Người điều phối để điều chỉnh hợp đồng hoặc tìm lô hàng khác bù vào phần thiếu. |

---

## 3. Phương Thức Tiêu Thụ: Đặt Hàng Trước & Đấu Giá Tương Lai

### Tôi có thể đăng bán nông sản khi quả vẫn còn trên cây (Đấu giá Hợp đồng Tương lai) được không?
Có. FARMOSA cho phép nông dân niêm yết các lô hàng chưa thu hoạch (`Pre-Harvest Batch`) để tổ chức phiên Đấu giá Hợp đồng Bao tiêu Tương lai.

Quy trình đấu giá tương lai vận hành như sau:
1. **Khởi tạo lô chưa thu hoạch**: Nông dân nhập ngày thu hoạch dự kiến, sản lượng ước tính, giá khởi điểm và nhật ký canh tác.
2. **AI Thẩm định Chỉ số Tin cậy (`Yield Confidence Score`)**: Hệ thống AI tự động phân tích dữ liệu thời tiết (NASA POWER), ảnh vệ tinh vùng trồng (Sentinel-2 NDVI) và lịch sử mùa vụ. Nếu điểm tin cậy đạt từ **80% trở lên**, phiên đấu giá sẽ được phê duyệt mở.
3. **Diễn ra phiên đấu giá kín**: Các doanh nghiệp vào phòng đấu giá trực tuyến để nạp giá. Người trả giá cao nhất khi hết giờ sẽ trúng thầu.
4. **Tự động chốt hợp đồng & Logistics**: Hệ thống tự động tạo Hợp đồng Bao tiêu B2B, khóa tiền cọc của người mua và đặt trước lịch xe kho lạnh cho đúng ngày thu hoạch.

### Tính năng Đặt hàng trước (Pre-Order) dành cho nông sản chưa thu hoạch hoạt động như thế nào?
Đặt hàng trước là phương thức bán hàng với **giá cố định** dành cho lô hàng đang trồng, giúp nông dân chốt trước đầu ra mà không cần qua đấu giá.

- **Cấu hình**: Nông dân bật chế độ "Cho phép đặt trước", nhập giá niêm yết/kg, số lượng đặt tối thiểu và % tiền cọc yêu cầu (mặc định 20%).
- **Người mua chốt đơn**: Doanh nghiệp chọn số lượng cần mua và thanh toán tiền cọc qua cổng ngân hàng.
- **Cập nhật tiến độ**: Nông dân cập nhật các cột mốc thực địa (như bọc trái, đạt độ đường, bắt đầu hái) kèm hình ảnh lên ứng dụng để người mua theo dõi.
- **Thu hoạch & Giao hàng**: Đến ngày hái, người mua thanh toán nấc tiền còn lại và hệ thống điều xe đến lấy hàng.

### Làm sao hệ thống đảm bảo người mua không "đặt cọc ảo" hoặc hủy đơn ngang xương?
Hệ thống thiết lập 3 tầng bảo vệ chặt chẽ để chống tình trạng bùng đơn của người mua:

1. **Khóa cọc phân tán (Redis Redlock)**: Khi người mua bấm ra giá đấu giá hoặc đặt giữ hàng, hệ thống lập tức phong tỏa tiền cọc của người mua qua Cổng thanh toán/Ngân hàng đối tác.
2. **Tịch thu tiền cọc**: Nếu người mua đơn phương hủy đơn hoặc không thanh toán nấc tiền còn lại khi đến ngày thu hoạch, toàn bộ tiền cọc sẽ bị tịch thu và chuyển đền bù cho nông dân.
3. **Trừ điểm uy tín (Credit Rating)**: Người mua vi phạm sẽ bị trừ điểm uy tín nặng, hạn chế quyền tham gia các phiên đấu giá cao cấp tiếp theo trên toàn hệ thống.

---

## 4. Khóa Giữ Hàng (Redlock) & Quy Trình Bàn Giao Vận Tải (Logistics Handover)

### Trạng thái "Giữ tạm" (Holding / Reserved) 15 phút là gì và nó bảo vệ tôi như thế nào?
Khi một người mua hoặc người điều phối chọn lô hàng của bà con để ghép đơn, hệ thống sẽ kích hoạt **Redis Distributed Lock (Redlock)** để chuyển lô hàng sang trạng thái **Giữ tạm (Reserved)** trong 15 phút kèm đồng hồ đếm ngược.

- **Bảo vệ nông dân**: Trong 15 phút này, số lượng nông sản đó được khóa an toàn, ngăn chặn việc lô hàng bị bán trùng (Overbooking) cho nhiều người mua khác cùng một lúc.
- **Xử lý hết giờ**: Nếu người mua hoàn tất xác nhận và đặt cọc trong 15 phút, lô hàng chuyển sang **Đã phân bổ (Allocated)**. Nếu hết 15 phút mà người mua không chốt, khóa tự động giải phóng và trả số lượng nông sản về trạng thái **Sẵn sàng bán (Available)** ngay lập tức.

### Quy trình bàn giao nông sản cho tài xế xe tải tại vườn được thực hiện như thế nào?
Mốc bàn giao tại vườn là mốc quan trọng nhất để **Chuyển giao rủi ro (Transfer of Risk)** từ nông dân sang bên vận chuyển theo Luật Thương mại. Quy trình gồm 3 bước:

1. **Cân đối chứng**: Nông dân và tài xế cùng tiến hành cân khối lượng thực tế tại điểm tập kết.
2. **Chụp ảnh hiện trạng**: Tài xế chụp ảnh thực tế lô hàng và đính kèm lên ứng dụng di động.
3. **Quét mã QR Bàn giao**: Nông dân mở ứng dụng, hiển thị mã QR của lô hàng để tài xế quét xác nhận.
   - *Kết quả*: Sau khi quét mã thành công, trạng thái lô hàng chuyển sang **Đang trung chuyển (`In-Transit`)**. Rủi ro bảo quản nông sản trong quá trình di chuyển trên đường chính thức chuyển sang cho Đơn vị vận tải.

---

## 5. Cảnh Báo Sớm, Giải Cứu Chủ Động & Trợ Lý AI

### Khi lô hàng của tôi có nguy cơ bị tồn đọng hoặc sắp hết hạn, hệ thống hỗ trợ giải cứu ra sao?
FARMOSA biến hoạt động "giải cứu nông sản" từ việc kêu gọi từ thiện bị động thành luồng nghiệp vụ tự động có kiểm soát qua 3 tầng xử lý của mô-đun **Rescue & Risk Service**:

- **Cảnh báo sớm**: Mô hình AI liên tục tính toán Chỉ số rủi ro hư hỏng (`Spoilage Risk Index`). Khi phát hiện lô hàng sắp tiệm cận ngưỡng hết hạn mà chưa có người mua, hệ thống tự động phát cảnh báo đỏ lên màn hình Người điều phối.
- **Tự động tìm đầu ra thay thế**: Hệ thống gợi ý 3 phương án cho Người điều phối phê duyệt:
  1. Tự động áp dụng cơ chế giảm giá theo thời gian thực (Dutch Auction) để đẩy bán nhanh cho các đại lý.
  2. Kết nối và chuyển hướng lô hàng sang các nhà máy chế biến sâu (sấy khô, làm mứt, đóng hộp) ở khu vực lân cận.
  3. Tự động gom lô với các vùng trồng lân cận để chào bán cho các chuỗi siêu thị lớn.

### Tôi có thể dùng giọng nói hoặc tin nhắn ngắn để đăng bán nông sản mà không cần bấm nhiều phím được không?
Có. Hệ thống tích hợp **Trợ lý AI Tương tác Tự động (Agentic AI Assistant)**. Bà con nông dân không cần biết thao tác phức tạp, chỉ cần đọc câu lệnh giọng nói hoặc nhắn tin văn bản đơn giản.

*Ví dụ câu lệnh:* 
> *"Đăng bán 2 tấn xoài Cát Hòa Lộc thu hoạch ngày 15 tháng 11, giá 40 ngàn một ký tại vườn Tiền Giang."*

AI sẽ tự động phân tích ý định, điền đầy đủ các thông tin vào biểu mẫu lô hàng và hiển thị màn hình **"Xác nhận đăng bài"** chỉ với 1 cú chạm.

### Điểm uy tín (Credit Rating) của nông hộ được tính như thế nào?
Điểm uy tín được hệ thống tự động cập nhật sau mỗi giao dịch dựa trên 3 tiêu chí:
- **Tính trung thực của dữ liệu**: Nông sản bàn giao thực tế đúng phẩm cấp và khối lượng đã khai báo.
- **Tỷ lệ hoàn thành đơn**: Không tự ý hủy hợp đồng hoặc bán "tuồn" hàng ra ngoài sau khi đã chốt giao dịch.
- **Đúng hẹn bàn giao**: Bàn giao hàng đúng thời gian đã cam kết với tài xế.

*Lợi ích*: Nông hộ có điểm uy tín cao sẽ được hệ thống ưu tiên hiển thị ở vị trí hàng đầu trên bản đồ Cung – Cầu và được ưu tiên ghép nối với các siêu thị, doanh nghiệp thu mua lớn.
