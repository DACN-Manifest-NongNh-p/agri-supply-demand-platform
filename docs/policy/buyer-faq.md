---
id: buyer-faq
title: Hỏi đáp dành cho người mua
audience: [buyer, coordinator]
lang: vi
version: 1.0
effective_date: 2026-11-05
rules: [lockMinutes, depositPercent, coldChainMin, coldChainMax, dueSoonDays]
---

# Hỏi đáp dành cho người mua

## Tổng quan và đăng nhu cầu

### Farmora giúp doanh nghiệp mua nông sản tươi như thế nào?
- **Minh bạch nguồn gốc:** doanh nghiệp xem trực tiếp từng lô hàng với giống, vùng trồng, ngày thu hoạch thực tế hoặc dự kiến và chứng nhận (VietGAP, GlobalGAP, hữu cơ, kiểm dịch thực vật).
- **Biết trước độ tươi:** mỗi lô có đồng hồ đếm ngược thời hạn bảo quản, giúp lên kế hoạch phân phối trước khi hàng giảm phẩm cấp.
- **Chủ động nguồn cung dài hạn:** qua đấu giá lô chưa thu hoạch và đặt hàng trước, doanh nghiệp chốt sản lượng sớm với giá cố định hoặc giá đấu cạnh tranh.

### Đăng nhu cầu thu mua như thế nào?
1. **Nhập thông tin đơn:** loại nông sản, tổng khối lượng (kg hoặc tấn), tiêu chuẩn chất lượng tối thiểu, giá trần mong muốn và địa điểm nhận hàng.
2. **Chọn hạn nhận hàng:** thời điểm muộn nhất hàng phải về kho.
3. **Gửi nhu cầu:** hệ thống tự tìm và đề xuất các lô phù hợp nhất trong bán kính chở được. Nhu cầu cần hàng trong vòng {{rule:dueSoonDays}} ngày mà chưa đủ nguồn sẽ được đánh dấu để Điều phối viên ưu tiên xử lý.

## Ghép nối nguồn hàng

### Hệ thống dựa vào đâu để đề xuất nguồn hàng?
Mỗi cặp nhu cầu – lô hàng được chấm **điểm phù hợp** theo bốn yếu tố:
- **Độ tươi:** ưu tiên lô có thời hạn bảo quản còn lại ngắn nhất nhưng vẫn đủ thời gian chở và bán (hết hạn trước – xuất trước).
- **Khoảng cách:** khoảng cách thực tế theo đường đi từ vườn hoặc điểm tập kết tới kho nhận, để giảm thời gian và cước vận chuyển.
- **Chất lượng và chứng nhận:** chỉ khớp lô đạt đúng chứng nhận doanh nghiệp yêu cầu; lô có nhãn "Có chứng nhận" được ưu tiên.
- **Rủi ro hư hỏng:** loại các lô có nguy cơ hư quá ngưỡng an toàn trong suốt hành trình dự kiến.

### Đơn hàng lớn được gom từ nhiều nông hộ như thế nào?
Với đơn lớn (ví dụ 20 tấn thanh long VietGAP), hệ thống:
- tìm các nông hộ trong cùng vùng có ngày thu hoạch khớp với khung thời gian của doanh nghiệp;
- kiểm tra chứng nhận và nhật ký canh tác để các lô có phẩm cấp đồng đều;
- gom thành **một lô hợp nhất**: doanh nghiệp chỉ làm việc với một hợp đồng và một lịch lấy hàng tập trung tại điểm tập kết vùng.

## Đấu giá và đặt hàng trước

### Tham gia đấu giá lô chưa thu hoạch như thế nào?
1. Chọn phiên theo loại cây, ngày thu hoạch dự kiến, giá khởi điểm và ảnh, video thực địa của nông hộ.
2. Khóa **cọc tham gia** qua cổng thanh toán; chỉ sau đó mới được ra giá.
3. Ra giá trực tuyến; mỗi lần ra giá phải cao hơn giá hiện tại ít nhất một bước giá.
4. Hết giờ, người trả giá cao nhất thắng và phải ký hợp đồng bao tiêu trong 24 giờ.

Toàn bộ quy định: xem *Quy chế đấu giá nông sản*.

### Điểm tin cậy sản lượng giúp đánh giá rủi ro thế nào?
Rủi ro lớn nhất khi mua lô chưa thu hoạch là sản lượng thực tế không đạt cam kết. Hệ thống tính **điểm tin cậy sản lượng** (0–100%) từ ảnh vệ tinh vùng trồng (sức khỏe tán cây, diện tích thực tế), dữ liệu thời tiết lịch sử và nhật ký canh tác. Điểm hiện trên thẻ đấu giá; chỉ lô đạt từ 80% mới được mở phiên. Điểm càng cao, sản lượng dự báo càng đáng tin.

### Đặt hàng trước hoạt động thế nào và cọc bao nhiêu?
Đặt hàng trước là mua lô chưa thu hoạch với **giá cố định** do nông hộ niêm yết:
- Chọn số lượng trên lô có bật đặt hàng trước, xác nhận giá, rồi đặt cọc qua cổng thanh toán.
- Tỷ lệ cọc do nông hộ đặt, **mặc định 20%** giá trị đơn (40% nếu điểm uy tín của người mua dưới 70). Cọc được giữ ở cổng thanh toán đối tác đến khi bàn giao hàng.
- Doanh nghiệp theo dõi các mốc thu hoạch (bọc trái, thử độ đường, hái mẫu) qua ảnh và video nông hộ cập nhật.

### Đơn mua hàng đã thu hoạch phải cọc bao nhiêu?
Người mua đặt cọc {{rule:depositPercent}}% giá trị đơn để xác nhận đơn; phần còn lại thanh toán khi nhận hàng.

## Giữ hàng và hủy đơn

### Giữ hàng khi chọn mua bảo vệ người mua khỏi bị bán trùng thế nào?
Khi bấm "Đặt giữ hàng" hoặc thắng thầu, số lượng đã chọn được giữ riêng cho bạn và màn hình hiện đồng hồ **{{rule:lockMinutes}} phút**. Trong thời gian này không ai khác mua được số lượng đó.
- Đặt cọc xong trong {{rule:lockMinutes}} phút: đơn được xác nhận.
- Hết giờ mà chưa đặt cọc: việc giữ tự hủy và hàng trở lại thị trường.

### Hủy đơn và tiền cọc được xử lý thế nào?
| Trường hợp | Xử lý |
| :--- | :--- |
| **Người mua tự hủy** sau khi đã chốt đặt hàng trước hoặc thắng đấu giá | Mất **100% tiền cọc**, chuyển cho nông hộ để bù chi phí giữ hàng; người mua bị trừ điểm uy tín. |
| **Nông hộ tự hủy** hoặc bán cho người khác | Người mua được hoàn 100% tiền cọc **và nhận thêm khoản đền bằng 100% tiền cọc** (tổng 200%); nông hộ bị trừ điểm uy tín. |
| **Thiên tai, dịch bệnh** được cơ quan chức năng xác nhận | Người mua được **hoàn 100% tiền cọc**; không bên nào bị phạt hay trừ điểm. |
| **Sản lượng thực tế dưới 80% cam kết** | Người mua chọn nhận sản lượng thực tế với giá điều chỉnh, hoặc hủy đơn và nhận lại 100% tiền cọc. |

Mức trừ điểm cụ thể: xem *Quy chế giữ hàng, đặt cọc và hủy đơn*.

## Nghiệm thu và khiếu nại

### Nghiệm thu hàng và áp dụng dung sai khi nhận hàng thế nào?
1. Khi xe tới, tài xế báo đã đến và cửa sổ nghiệm thu bắt đầu: **2 giờ làm việc** với rau ăn lá, hàng rất dễ hỏng; **6 giờ làm việc** với trái cây thông thường.
2. Đại diện doanh nghiệp cùng tài xế kiểm số thùng, cân lại, kiểm niêm phong và mã QR lô hàng.
3. Áp dụng dung sai: tổng khuyết tật tối đa 10%, khuyết tật nặng tối đa 5%, thối hỏng tối đa 1%.
   - Nằm trong dung sai: nhận hàng và thanh toán đủ, không được từ chối.
   - Vượt dung sai: nhận hàng và được trừ tiền phần vượt, hoặc từ chối lô hàng và mở tranh chấp.
4. Hết cửa sổ nghiệm thu mà không phản hồi, đơn tự động được coi là nghiệm thu đạt.

### Hàng giao bị hư quá mức cho phép thì người mua được bảo vệ thế nào?
1. **Lập biên bản trên ứng dụng** trong cửa sổ nghiệm thu: ảnh, video chỗ hàng lỗi, nhiệt độ thùng xe lúc mở cửa và khối lượng cân hụt.
2. **Tạm giữ khoản thanh toán còn lại:** phần tiền chưa giải ngân được cổng thanh toán đối tác giữ lại cho đến khi hòa giải xong.
3. **Xác định bên có lỗi** (Điều phối viên quyết định trong 24 giờ làm việc):
   - nhiệt độ thùng xe vượt dải {{rule:coldChainMin}}–{{rule:coldChainMax}}°C trong khi chở: **đơn vị vận tải** bồi thường;
   - nhiệt độ ổn định nhưng hàng hư từ bên trong do hái sai kỹ thuật hoặc ủ kín: **nông hộ** bồi thường.

   Tiền bồi thường được trừ từ khoản ký quỹ của bên có lỗi để trả lại cho doanh nghiệp.

## Vận chuyển và trợ lý

### Theo dõi xe và nhiệt độ khi vận chuyển thế nào?
- **Vị trí:** xem vị trí xe và giờ đến dự kiến trên bản đồ.
- **Nhiệt độ:** xe lạnh gửi nhiệt độ về hệ thống ít nhất 15 phút một lần; dải an toàn là {{rule:coldChainMin}}–{{rule:coldChainMax}}°C (hoặc dải riêng ghi trong Term Sheet).
- **Cảnh báo:** nhiệt độ ra ngoài dải an toàn quá 15 phút thì tài xế, người mua và Điều phối viên đều nhận cảnh báo.

### Trợ lý AI trên Farmora giúp được gì?
Trợ lý trong khung chat ở góc phải màn hình có thể trả lời câu hỏi về quy định của Farmora và thao tác giúp trên trang theo yêu cầu, ví dụ mở danh sách đơn hàng, tìm nguồn hàng theo loại nông sản hay điền sẵn biểu mẫu nhu cầu. Với các thao tác có ràng buộc như đặt giữ hàng, đặt cọc hay ra giá, trợ lý luôn hỏi bạn xác nhận trước khi bấm.
