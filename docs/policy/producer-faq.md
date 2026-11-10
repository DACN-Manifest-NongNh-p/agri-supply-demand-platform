---
id: producer-faq
title: Hỏi đáp dành cho nông hộ và hợp tác xã
audience: [producer, coordinator]
lang: vi
version: 1.0
effective_date: 2026-11-05
rules: [lockMinutes, holdHours, holdWarningHours, sellSoonDays]
---

# Hỏi đáp dành cho nông hộ và hợp tác xã

## Tổng quan

### Farmora là gì và khác gì thương lái hay sàn thương mại điện tử?
Farmora không thu mua nông sản và không phải sàn bán lẻ, mà là nền tảng kết nối, điều phối cung – cầu nông sản B2B theo thời gian thực. Nông hộ và hợp tác xã bán trực tiếp cho siêu thị, nhà bán lẻ, doanh nghiệp xuất khẩu và nhà máy chế biến mà không phải phụ thuộc vào thương lái địa phương.

Khác với sàn thương mại điện tử niêm yết sản phẩm tĩnh, Farmora quản lý từng lô hàng kèm đồng hồ đếm ngược thời hạn bảo quản, tự ghép nối theo nhiều tiêu chí, gom nhiều lô nhỏ thành đơn lớn và cảnh báo sớm khi lô có nguy cơ ứ đọng để kịp tìm đầu ra.

### Nông hộ có phải trả phí đăng bán hay chia doanh thu không?
Không. Nông hộ và hợp tác xã đăng ký tài khoản, khai báo vùng trồng và đăng bán lô hàng **hoàn toàn miễn phí**; Farmora không thu tiền trên giao dịch của nông hộ. Nguồn thu của nền tảng đến từ phí phần mềm nâng cao cho doanh nghiệp thu mua lớn, phí kết nối với đơn vị vận tải và báo cáo phân tích thị trường.

### Vị trí trang trại của tôi có bị lộ cho thương lái đến ép giá không?
Không. Trên bản đồ công khai, lô hàng chỉ hiện **vị trí làm mờ lệch ngẫu nhiên 1–2 km** so với trang trại thật; tọa độ chính xác, số nhà và số điện thoại được ẩn. Tọa độ chính xác và số điện thoại chỉ được gửi cho người mua và tài xế của đơn đó **sau khi giao dịch đã chốt và tiền cọc hoặc bảo lãnh thanh toán đã được khóa**.

## Lô hàng

### Vì sao phải tạo từng lô thay vì nhập tổng sản lượng?
Mỗi đợt hái có thời điểm thu hoạch, độ chín và hạn bảo quản khác nhau, nên mỗi đợt là một lô riêng có mã riêng. Quản lý theo lô giúp:
- **Biết đúng hạn bảo quản:** mỗi lô có đồng hồ riêng; lô hái trước được ưu tiên bán trước.
- **Bán đúng giá theo phẩm cấp:** tách lô VietGAP, GlobalGAP với lô thông thường.
- **Trừ đúng số lượng đã bán:** phần còn lại của vườn không bị ảnh hưởng.

### Tạo lô hàng và đính kèm chứng nhận như thế nào?
1. Vào mục **Lô hàng**, chọn **"Tạo lô mới"**.
2. Nhập: loại nông sản và giống (ví dụ xoài cát Hòa Lộc, thanh long ruột đỏ), sản lượng thực tế hoặc dự kiến, vị trí vùng trồng hoặc điểm tập kết, ngày hái thực tế hoặc dự kiến, khung thời gian có thể giao.
3. Đính kèm ảnh vườn hoặc nông sản sau khi hái, và ảnh hoặc file PDF chứng nhận VietGAP, GlobalGAP, hữu cơ hay phiếu kiểm định dư lượng.
4. Bấm **"Lưu lô hàng"**: hệ thống cấp mã lô và bắt đầu đếm thời hạn bảo quản. Lô có chứng nhận được xác minh sẽ có nhãn **"Có chứng nhận"** và được ưu tiên hiển thị cho siêu thị lớn.

Cũng có thể nhập nhiều lô cùng lúc từ file bảng tính.

### Thời hạn bảo quản còn lại được tính thế nào và vì sao quan trọng?
Thời hạn còn lại = ngày giờ hái + thời hạn bảo quản tiêu chuẩn của loại nông sản − thời điểm hiện tại (điều chỉnh theo điều kiện bảo quản lạnh hay thường). Khi hai lô cùng phù hợp một người mua, lô còn ít thời hạn hơn được đưa lên trước để tránh hư hỏng. Lô còn hàng chưa bán và cách hạn bán dưới {{rule:sellSoonDays}} ngày được ưu tiên ở đầu danh sách.

### Sản lượng thực tế nhiều hoặc ít hơn số đã đăng thì làm sao?
Nông hộ cập nhật lô hàng bất cứ lúc nào trước khi lô chuyển sang "Đã giao".
| Trường hợp | Xử lý |
| :--- | :--- |
| **Nhiều hơn** | Vào "Cập nhật lô hàng" nhập phần tăng thêm; phần dư được đưa vào "Sẵn sàng bán" cho đơn khác. |
| **Ít hơn, chưa chốt đơn** | Nhập số lượng thực tế; không bị phạt. |
| **Ít hơn, đã chốt đơn** | Hệ thống cảnh báo; nông hộ nhập lý do (thiên tai, sâu bệnh…). Người mua và Điều phối viên được báo để điều chỉnh hợp đồng hoặc tìm lô khác bù. Nếu sản lượng dưới 80% cam kết, người mua được chọn nhận theo giá điều chỉnh hoặc hủy và nhận lại 100% cọc. |

## Đấu giá và đặt hàng trước

### Có bán được khi quả còn trên cây không?
Có, qua **đấu giá lô chưa thu hoạch**:
1. Tạo lô chưa thu hoạch với ngày thu hoạch dự kiến, sản lượng ước tính, giá khởi điểm, bước giá và nhật ký canh tác.
2. Hệ thống chấm **điểm tin cậy sản lượng** từ ảnh vệ tinh vùng trồng, dữ liệu thời tiết và lịch sử mùa vụ; đạt từ **80%** thì phiên được mở.
3. Người mua ra giá trực tuyến, mỗi lần cao hơn ít nhất một bước giá; hết giờ, người trả giá cao nhất thắng.
4. Hệ thống tạo hợp đồng bao tiêu, khóa cọc của người mua và đặt trước lịch xe cho ngày thu hoạch.

Toàn bộ quy định: xem *Quy chế đấu giá nông sản*.

### Đặt hàng trước hoạt động thế nào?
Đặt hàng trước là bán lô đang trồng với **giá cố định**, không qua đấu giá:
- **Cài đặt:** bật "Cho phép đặt trước", nhập giá mỗi kg, số lượng đặt tối thiểu và tỷ lệ cọc (mặc định 20%).
- **Người mua chốt:** chọn số lượng và đặt cọc qua cổng thanh toán.
- **Cập nhật tiến độ:** đăng ảnh các mốc (bọc trái, đạt độ đường, bắt đầu hái) để người mua theo dõi.
- **Thu hoạch và giao:** đến ngày hái, người mua thanh toán phần còn lại và hệ thống điều xe đến lấy hàng.

### Làm sao tránh người mua đặt cọc ảo hoặc hủy ngang?
1. **Cọc bị khóa thật:** khi người mua ra giá hoặc đặt giữ hàng, tiền cọc bị phong tỏa ở cổng thanh toán đối tác.
2. **Mất cọc khi hủy:** người mua tự hủy hoặc không thanh toán phần còn lại đến ngày thu hoạch thì mất toàn bộ tiền cọc, chuyển cho nông hộ.
3. **Trừ điểm uy tín:** người mua vi phạm bị trừ điểm (hủy đặt trước -20, bỏ thầu -30) và bị hạn chế quyền đấu giá, đặt trước.

### Nếu tôi hủy đơn đặt hàng trước thì sao?
Nông hộ tự hủy hoặc bán cho người khác phải hoàn 100% tiền cọc cho người mua và đền thêm một khoản bằng 100% tiền cọc; bán chui lô đã có cam kết bị trừ 40 điểm uy tín. Nếu do thiên tai, dịch bệnh có xác nhận của cơ quan chức năng thì không bị phạt. Chi tiết: xem *Quy chế giữ hàng, đặt cọc và hủy đơn*.

## Giữ hàng và bàn giao

### Trạng thái "Đang giữ" là gì và bảo vệ tôi thế nào?
Có hai trường hợp:
- **Người mua chọn mua lô của bạn:** số lượng đó được giữ riêng {{rule:lockMinutes}} phút để người mua đặt cọc, nên không thể bị bán trùng cho người khác. Đặt cọc xong thì lô chuyển sang "Đã phân bổ"; hết giờ mà chưa cọc thì số lượng tự trở lại "Sẵn sàng bán".
- **Hệ thống hoặc Điều phối viên ghép lô của bạn với một nhu cầu:** bạn có **{{rule:holdHours}} giờ để xác nhận**; khi còn {{rule:holdWarningHours}} giờ bạn sẽ nhận cảnh báo. Quá hạn mà chưa xác nhận thì việc giữ hết hiệu lực.

### Bàn giao hàng cho tài xế tại vườn như thế nào?
Đây là mốc **chuyển rủi ro** từ nông hộ sang đơn vị vận tải:
1. **Cân đối chứng:** nông hộ và tài xế cùng cân tại điểm tập kết (được lệch ±5% so với Term Sheet).
2. **Chụp ảnh:** tài xế chụp ít nhất 2 ảnh lô hàng trên xe và tải lên ứng dụng.
3. **Quét mã QR:** nông hộ mở mã QR của lô để tài xế quét; hai bên bấm "Xác nhận bàn giao".

Sau khi xác nhận, lô chuyển sang "Đang vận chuyển" và rủi ro hư hỏng trên đường thuộc về đơn vị vận tải.

## Cảnh báo, giải cứu và trợ lý

### Lô hàng sắp hết hạn mà chưa bán được thì hệ thống hỗ trợ gì?
- **Cảnh báo sớm:** hệ thống theo dõi chỉ số rủi ro hư hỏng; mức cảnh báo (từ 0,4) báo vàng cho bạn và Điều phối viên, mức khẩn cấp (từ 0,7) báo đỏ.
- **Tìm đầu ra thay thế** (Điều phối viên duyệt):
  1. đưa vào đấu giá giảm giá theo thời gian để bán nhanh cho đại lý (không xuống dưới giá sàn bạn đặt);
  2. chuyển lô sang nhà máy chế biến gần đó (sấy, làm mứt, đóng hộp);
  3. gom chung với các vùng trồng lân cận để chào bán cho chuỗi siêu thị lớn.

### Có thể nhờ trợ lý AI thao tác giúp không?
Có. Trợ lý trong khung chat ở góc phải màn hình trả lời câu hỏi về quy định và có thể thao tác giúp trên trang theo yêu cầu, ví dụ: *"Tạo lô 2 tấn xoài cát Hòa Lộc thu hoạch ngày 15/11, giá 40 nghìn một ký."* Trợ lý điền sẵn biểu mẫu lô hàng và luôn hỏi bạn xác nhận trước khi lưu hay gửi.

### Điểm uy tín của nông hộ được tính thế nào?
Mỗi tài khoản bắt đầu với 100 điểm và được cập nhật sau mỗi giao dịch theo:
- **Trung thực:** hàng giao đúng phẩm cấp và khối lượng đã khai.
- **Hoàn thành đơn:** không tự hủy hợp đồng hay bán hàng ra ngoài sau khi đã chốt.
- **Đúng hẹn:** bàn giao cho tài xế đúng giờ đã cam kết.

Nông hộ điểm cao được ưu tiên hiển thị trên bản đồ cung – cầu và khi ghép với siêu thị, doanh nghiệp lớn. Điểm thấp làm lô hàng bị xếp sau khi ghép nối; dưới 50 điểm bị khóa quyền tạo phiên đấu giá và đặt trước 60 ngày, dưới 30 điểm bị khóa tài khoản vĩnh viễn.
