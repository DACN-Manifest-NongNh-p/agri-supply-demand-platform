---
id: hold-and-cancellation
title: Quy chế giữ hàng, đặt cọc và hủy đơn
audience: [producer, buyer, coordinator]
lang: vi
version: 1.0
effective_date: 2026-11-05
rules: [lockMinutes, depositPercent, holdHours, holdWarningHours, signOffKg, autoMatchMinScore]
---

# Quy chế giữ hàng, đặt cọc và hủy đơn

## Giữ hàng

### Giữ hàng khi người mua chọn mua
Khi người mua bấm đặt giữ một lô hoặc thắng một phiên đấu giá, quyền sở hữu chưa chuyển ngay. Số lượng được chọn được **giữ riêng cho người mua trong {{rule:lockMinutes}} phút** và trừ khỏi số lượng còn bán của lô; không ai khác đặt giữ hay mua được số lượng này trong thời gian đó.
- **Đặt cọc kịp:** người mua xác nhận và đặt cọc trong {{rule:lockMinutes}} phút thì đơn được xác nhận và số lượng chuyển sang "Đã phân bổ".
- **Hết giờ:** nếu hết {{rule:lockMinutes}} phút mà chưa đặt cọc, việc giữ tự hủy và số lượng trở lại trạng thái "Sẵn sàng bán" cho người khác.

### Giữ hàng chờ nông hộ xác nhận
Khi hệ thống hoặc Điều phối viên ghép một nhu cầu thu mua với lô của nông hộ, lô được giữ cho đơn đó và **nông hộ có {{rule:holdHours}} giờ để xác nhận**. Khi chỉ còn {{rule:holdWarningHours}} giờ, nông hộ, người mua và Điều phối viên đều nhận cảnh báo. Quá hạn mà nông hộ chưa xác nhận thì việc giữ hết hiệu lực.

### Khi nào việc giữ hàng cần Điều phối viên duyệt
- Ghép nối có điểm phù hợp từ {{rule:autoMatchMinScore}}% trở lên được giữ tự động; điểm thấp hơn phải chờ Điều phối viên xem xét.
- Lượt giữ từ {{rule:signOffKg}} kg trở lên luôn cần Điều phối viên duyệt.

## Trạng thái lô hàng

### Ý nghĩa các trạng thái của lô hàng
| Trạng thái | Ý nghĩa | Việc có thể làm |
| :--- | :--- | :--- |
| **Chưa thu hoạch** | Nông sản còn trên vườn, chưa đến ngày hái. | Mở phiên đấu giá, bật đặt hàng trước. |
| **Sẵn sàng bán** | Đã thu hoạch hoặc sẵn sàng giao ngay tại vườn hoặc điểm tập kết. | Đặt mua giao ngay, đặt giữ hàng. |
| **Đang giữ** | Đang được giữ cho một người mua chờ đặt cọc hoặc chờ nông hộ xác nhận. | Đặt cọc, xác nhận, hoặc hủy giữ để trả lại. |
| **Đã phân bổ** | Đã chốt đơn hoặc hợp đồng, tiền cọc hoặc thanh toán đã xác nhận. | Xếp lịch xe, đóng gói. |
| **Đang vận chuyển** | Đã bàn giao cho đơn vị vận tải. | Theo dõi vị trí và nhiệt độ xe. |
| **Đã giao** | Đã giao tới người mua và qua nghiệm thu. | Đánh giá đối tác. |
| **Hết hạn** | Thời hạn bảo quản đã chạm mức nguy cơ hư hỏng. | Đưa vào luồng giải cứu. |

## Tiền cọc

### Đơn mua hàng đã thu hoạch phải đặt cọc bao nhiêu
Người mua đặt cọc **{{rule:depositPercent}}% giá trị đơn** để xác nhận đơn; phần còn lại thanh toán khi nhận hàng.

### Đơn đặt hàng trước phải đặt cọc bao nhiêu
Với lô chưa thu hoạch, nông hộ tự đặt tỷ lệ cọc khi bật đặt hàng trước; **mặc định 20%** giá trị đơn. Người mua có điểm uy tín dưới 70 phải đặt cọc **40%**.

### Người mua hủy đơn đặt hàng trước thì sao
Người mua đơn phương hủy (không có lý do bất khả kháng) **mất 100% tiền cọc**. Tiền cọc chuyển cho nông hộ để bù chi phí chăm vườn và cơ hội bán cho người khác. Người mua bị trừ 20 điểm uy tín.

### Nông hộ hủy đơn đặt hàng trước hoặc bán cho người khác thì sao
Nông hộ phải **hoàn 100% tiền cọc cho người mua và đền thêm một khoản bằng 100% tiền cọc** (người mua nhận lại tổng cộng 200% tiền cọc). Nông hộ bị trừ 40 điểm uy tín nếu đã bán lô đang có cam kết cho người khác.

### Hủy đơn do thiên tai, dịch bệnh
Thiên tai, dịch bệnh, sương muối… có xác nhận của cơ quan chức năng địa phương (ví dụ Sở Nông nghiệp và Phát triển nông thôn) được coi là bất khả kháng: người mua được **hoàn 100% tiền cọc**, nông hộ không bị phạt và không bên nào bị trừ điểm.

### Sản lượng thực tế thấp hơn cam kết
Nếu sản lượng thực tế khi thu hoạch **dưới 80% sản lượng đã cam kết**, người mua được chọn: (1) nhận sản lượng thực tế với giá điều chỉnh tương ứng, hoặc (2) hủy đơn và nhận lại 100% tiền cọc.

### Thắng đấu giá nhưng không ký hợp đồng
Người thắng phải ký hợp đồng bao tiêu trong 24 giờ sau khi phiên đóng. Nếu từ chối: mất 100% cọc đấu giá, bị trừ 30 điểm uy tín, bị khóa quyền đấu giá 30 ngày; quyền mua chuyển cho người trả giá cao thứ hai nếu giá chênh không quá 5%.

## Sự cố vận chuyển

### Xe hỏng hoặc kho lạnh trên xe bị hỏng
1. Nhiệt độ thùng xe vượt mức an toàn quá 15 phút thì tài xế, người mua và Điều phối viên nhận cảnh báo.
2. Vượt mức quá **45 phút**, hoặc xe gặp sự cố, tài xế báo sự cố trên ứng dụng; hệ thống tìm xe trống trong bán kính **30 km** để chuyển hàng sang.
3. Nếu sự cố kéo dài làm chỉ số rủi ro hư hỏng lên **mức khẩn cấp (từ 0,7)**, Điều phối viên có thể dừng hành trình và chuyển lô tới cơ sở chế biến gần nhất hoặc bán giảm giá giải cứu.

Chi tiết trách nhiệm bồi thường: xem *Quy định trách nhiệm giao nhận và vận tải*.

## Điểm uy tín

### Điểm uy tín bắt đầu và bị trừ như thế nào
Mỗi tài khoản đã xác thực bắt đầu với **100 điểm**. Các vi phạm bị trừ điểm:
| Vi phạm | Trừ điểm |
| :--- | :--- |
| Hủy đơn đặt hàng trước không có lý do hợp lệ | **-20 điểm / lần** |
| Bỏ thầu sau khi thắng phiên đấu giá | **-30 điểm / lần** |
| Bán chui lô hàng đã có cam kết giữ hoặc đặt cọc | **-40 điểm / lần** |
| Vi phạm khi giao nhận (giao thiếu, bỏ chuyến, để xe chờ quá lâu, từ chối nhận hàng vô cớ…) | **-5 đến -20 điểm** tùy mức độ, do Điều phối viên quyết định khi hòa giải |

### Điểm uy tín thấp bị hạn chế gì
| Điểm | Hạn chế |
| :--- | :--- |
| **Dưới 70** | Tỷ lệ cọc bắt buộc khi đặt hàng trước và đấu giá tăng lên **40%**. |
| **Dưới 50** | Tạm khóa quyền tạo phiên đấu giá và đặt hàng trước trong **60 ngày**. |
| **Dưới 30** | Khóa tài khoản vĩnh viễn và đưa vào danh sách đen. |

Điểm uy tín thấp cũng làm lô hàng hoặc tài khoản bị xếp sau khi hệ thống ghép nối.
