---
id: delivery-responsibility
title: Quy định trách nhiệm giao nhận và vận tải
audience: [producer, buyer, logistics, coordinator]
lang: vi
version: 1.0
effective_date: 2026-11-05
rules: [coldChainMin, coldChainMax]
---

# Quy định trách nhiệm giao nhận và vận tải

## Nguyên tắc chung

### Ai chịu trách nhiệm gì trong giao nhận
- **Farmora:** vận hành hệ thống, ghép nối, đếm ngược thời hạn bảo quản, cảnh báo rủi ro hư hỏng và giữ hàng chống bán trùng. Farmora không sở hữu xe, không thu mua nông sản và không bồi thường tổn thất hàng hóa, trừ khi do lỗi phần mềm.
- **Nông hộ, người mua và đơn vị vận tải:** tự chịu trách nhiệm về tính trung thực của thông tin khai báo, chất lượng hàng thực tế, điều kiện bảo quản lạnh và tiến độ giao nhận.

### Rủi ro hàng hóa chuyển sang bên nào và khi nào
Theo Điều 57 Luật Thương mại 2005 và thông lệ thương mại nông sản tươi:
- **Mặc định:** rủi ro chuyển từ nông hộ sang đơn vị vận tải (hoặc người mua) khi hàng đã xếp xong lên xe và hai bên xác nhận bàn giao ở **Mốc 2**.
- **Người mua tự chở:** rủi ro chuyển sang người mua ngay khi bốc xong hàng lên xe của người mua.
- **Thỏa thuận khác:** các bên có thể chọn mốc khác (ví dụ giao tại kho người mua) trong Term Sheet; mốc này phải được ghi trên hệ thống trước khi xe chạy.

## Bốn mốc giao nhận

### Tổng quan bốn mốc giao nhận
Nhận chuyến (Mốc 1) → Lấy hàng và chuyển rủi ro (Mốc 2) → Trên đường (Mốc 3) → Tới nơi và nghiệm thu (Mốc 4). Mỗi mốc cần xác nhận của hai phía và ảnh chụp làm bằng chứng khi có tranh chấp.

### Mốc 1: Nhận chuyến
- Khi hai bên xác nhận Term Sheet, hệ thống tạo yêu cầu vận chuyển gồm: điểm lấy hàng, điểm giao, khối lượng, khung giờ sẵn sàng và loại xe cần (xe thường hoặc xe lạnh {{rule:coldChainMin}}–{{rule:coldChainMax}}°C).
- Đơn vị vận tải nhận chuyến trên ứng dụng, cam kết biển số xe, loại thùng và giờ có mặt.
- Nếu thời gian chở cộng thời gian chờ vượt quá thời hạn bảo quản còn lại của lô, hệ thống không cho gán chuyến và yêu cầu đổi sang xe lạnh hoặc đổi tuyến.

### Mốc 2: Bàn giao khi lấy hàng
- Tài xế và nông hộ cùng kiểm số lượng, cân khối lượng thực tế và chụp ảnh tình trạng đóng gói, độ tươi.
- Tài xế quét mã QR của lô trên ứng dụng của nông hộ; hai bên nhập khối lượng cân (được lệch ±5% so với Term Sheet); tải lên ít nhất 2 ảnh lô hàng trên xe.
- Khi cả hai bấm **"Xác nhận bàn giao"**, lô chuyển sang "Đang vận chuyển" và rủi ro chuyển sang đơn vị vận tải.

### Mốc 3: Trên đường
- Tài xế cập nhật khi có sự cố (hỏng xe, hỏng máy lạnh, kẹt xe nghiêm trọng) hoặc khi giờ đến dự kiến thay đổi.
- Hệ thống tính lại thời hạn bảo quản còn lại lúc tới nơi. Nếu hàng có nguy cơ hư quá dung sai, Điều phối viên nhận báo đỏ để xử lý.

### Mốc 4: Tới nơi và nghiệm thu
- Tài xế bấm **"Đã đến điểm giao"**; cửa sổ nghiệm thu bắt đầu đếm ngược.
- Người mua cân đối chứng, kiểm phẩm cấp và ghi kết quả: nhận đủ, nhận một phần hoặc từ chối.

## Cửa sổ nghiệm thu

### Người mua có bao lâu để nghiệm thu và khiếu nại
Tính từ lúc tài xế báo đã đến điểm giao:
- **2 giờ làm việc** với rau ăn lá và hàng rất dễ hỏng (thời hạn bảo quản ngắn);
- **6 giờ làm việc** với trái cây tươi thông thường (xoài, thanh long, dưa hấu, sầu riêng…).

Khiếu nại phải kèm biên bản và ảnh hoặc video bằng chứng.

### Hết cửa sổ nghiệm thu mà người mua không phản hồi
Hệ thống tự ghi nhận lô hàng **đã nghiệm thu đạt 100%**, đóng hồ sơ giao nhận và chuyển sang giải ngân cho người bán. Người mua không khiếu nại được nữa.

### Dung sai khi nghiệm thu
Có ba mức dung sai tính riêng, theo % tổng khối lượng: tổng khuyết tật tối đa 10%, khuyết tật nặng (dập nát, thâm đen, biến dạng) tối đa 5%, thối hỏng tối đa 1%. Chỉ khi nằm trong **cả ba mức**, người mua mới không được từ chối lô hàng và phải thanh toán đủ. Vượt **bất kỳ mức nào** (ví dụ dập nát 7% vượt mức 5% dù tổng khuyết tật dưới 10%) thì người mua được trừ tiền phần vượt hoặc từ chối và mở tranh chấp. Chi tiết: xem *Quy chuẩn chất lượng và độ tươi*.

## Trách nhiệm khi có thiệt hại

### Bảng phân định lỗi và bồi thường
Lỗi được xác định bằng cách so dữ liệu Mốc 2 (lấy hàng) với Mốc 4 (nghiệm thu).
| Sự cố | Dấu hiệu | Bên chịu trách nhiệm | Xử lý |
| :--- | :--- | :--- | :--- |
| **Giao thiếu khối lượng** | Cân ở Mốc 2 thấp hơn Term Sheet quá 5%; hoặc hao hụt từ Mốc 2 đến Mốc 4 quá 2%. | **Nông hộ** nếu thiếu từ Mốc 2; **đơn vị vận tải** nếu hao hụt trên đường. | Trừ tiền phần thiếu trên hóa đơn; bên vi phạm bị trừ điểm uy tín. |
| **Sai phẩm cấp, hàng lỗi từ gốc** | Ảnh Mốc 2 cho thấy hàng không đạt chuẩn đã cam kết hoặc đã có nấm mốc. | **Nông hộ** | Người mua được từ chối nhận; nông hộ chịu cước vận chuyển hai chiều và bị trừ điểm uy tín. |
| **Giao trễ làm hỏng hàng** | Thời gian chở vượt giờ đến cam kết quá 30% mà không báo sự cố hợp lệ; hàng hư ở Mốc 4. | **Đơn vị vận tải** | Bồi thường 100% giá trị phần hàng hư và chịu toàn bộ cước. |
| **Không giữ đúng nhiệt độ** | Hàng héo, chín sớm hoặc biến chất ở Mốc 4 dù đúng giờ, do không chạy máy lạnh trong dải {{rule:coldChainMin}}–{{rule:coldChainMax}}°C. | **Đơn vị vận tải** | Bồi thường theo biên bản kiểm định; bị trừ điểm uy tín và khóa quyền nhận chuyến lạnh 30 ngày. |
| **Hư hỏng tự nhiên trong dung sai** | Đúng giờ, đúng nhiệt độ, khuyết tật ở Mốc 4 nằm trong dung sai. | **Người mua** (rủi ro thương mại tự nhiên) | Người mua thanh toán đủ 100%. |
| **Người mua chậm nghiệm thu** | Xe đã báo Mốc 4 nhưng người mua không dỡ hàng hoặc không nghiệm thu trong cửa sổ nghiệm thu. | **Người mua** | Tự động thanh toán 100%; người mua chịu mọi hư hỏng do để hàng trên xe. |

### Điểm uy tín trong giao nhận
Vi phạm khi giao nhận (bỏ chuyến, giao thiếu, để xe chờ quá lâu, từ chối nhận hàng vô cớ) bị trừ 5–20 điểm uy tín tùy mức độ. Ngưỡng hạn chế theo điểm: xem *Quy chế giữ hàng, đặt cọc và hủy đơn*.

### Hòa giải tranh chấp giao nhận
Khi có khiếu nại ở Mốc 4, Điều phối viên làm trọng tài: xem nhật ký sự cố, ảnh Mốc 2 và Mốc 4, rồi ra quyết định hòa giải **trong 24 giờ làm việc**. Quyết định này là căn cứ cuối cùng để điều chỉnh điểm uy tín và nghĩa vụ giữa các bên.

## Giải cứu và đổi lộ trình

### Khi nào hệ thống báo động đỏ cho Điều phối viên
1. Tài xế báo sự cố nghiêm trọng ở Mốc 3 (hỏng xe, tai nạn) dự kiến kéo dài hơn 4 giờ.
2. Giờ đến dự kiến mới làm thời hạn bảo quản còn lại lúc tới nơi giảm xuống **dưới 20%** tổng thời hạn bảo quản của lô.
3. Người mua từ chối nhận ở Mốc 4 và không thể chở hàng về lại vì có nguy cơ thối hỏng.

### Ba phương án giải cứu
Hệ thống đề xuất và Điều phối viên duyệt một trong ba phương án:
1. **Chuyển cho người mua khác ở gần:** tìm doanh nghiệp hoặc thương lái gần vị trí xe đang cần cùng loại nông sản, bán giá chiết khấu (chấp nhận hạ phẩm cấp).
2. **Chuyển về cơ sở chế biến:** đổi hướng xe tới cơ sở sấy, làm mứt, ép nước hoặc cấp đông gần nhất để thu hồi giá trị nguyên liệu.
3. **Chuyển cho kênh từ thiện:** khi thời hạn bảo quản còn dưới 12 giờ, chuyển lô cho tổ chức từ thiện hoặc cứu trợ địa phương để tránh chi phí tiêu hủy.

## Phân vai trong giao nhận

### Ai làm, ai duyệt ở từng bước giao nhận
R = thực hiện, A = chịu trách nhiệm cuối cùng / duyệt, C = được hỏi ý kiến, I = được thông báo.
| Bước | Nông hộ | Người mua | Vận tải | Điều phối viên | Kiểm định | Hệ thống | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tạo yêu cầu vận chuyển | I | C | R | **A** | - | C (gợi ý xe) | I |
| Nhận chuyến (Mốc 1) | I | I | **R/A** | I | - | C (kiểm thời hạn) | I |
| Chuẩn bị và đóng gói | **R/A** | C | I | I | C | - | - |
| Kiểm và cân ở Mốc 2 | **R** | I | **R** | I | C | - | - |
| Xác nhận bàn giao Mốc 2 | **A** (bên giao) | I | **A** (bên nhận) | I | - | C (trừ số lượng) | I |
| Theo dõi Mốc 3 | - | I | **R/A** | I | - | C (tính lại rủi ro) | I |
| Cảnh báo trễ, hư hỏng | - | I | C | I | - | **R/A** (tự động) | I |
| Giao hàng (Mốc 4) | I | I | **R/A** | I | - | C (mở cửa sổ nghiệm thu) | I |
| Nghiệm thu Mốc 4 | I | **R/A** | I | I | C | - | - |
| Khiếu nại và bồi thường | C | C | C | **A** (hòa giải) | C | C | R (cập nhật điểm) |
| Duyệt phương án giải cứu | C | C | C | **A** | - | R (đề xuất) | I |

## Hiệu lực

### Quy định giao nhận áp dụng cho ai và thay đổi thế nào
Quy định áp dụng bắt buộc cho mọi nông hộ, người mua và đơn vị vận tải từ khi đăng ký tài khoản và đồng ý điều khoản sử dụng. Farmora có thể điều chỉnh dung sai, cửa sổ nghiệm thu hoặc mức điểm uy tín theo thực tế mùa vụ và pháp luật; thay đổi được thông báo **ít nhất 15 ngày** trước khi áp dụng.
