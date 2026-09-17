# HARM v21

Giải nén rồi mở HARM/index.html hoặc chạy qua máy chủ tĩnh cục bộ.

## Bổ sung v21
- Nhà và cây trôi vào từ trái, phải hoặc dưới trong khoảng 4.8–6.6 giây, sau đó lơ lửng nhẹ. Nhà vẫn chỉ xuất hiện khi được mở bằng than.
- Điểm chọn, cửa sổ và đường điện dùng cùng vị trí chuyển động. Nhà chỉ nhận nhu cầu sau khi gần tới vị trí.
- Mảnh nền tăng từ 48 lên 76, sắc độ rõ hơn ở vùng ô nhiễm.
- Vệt generative xám–cam có thêm hai nét song song mảnh.
- Máy lớn hơn khoảng 10%, thêm các mảng tương phản lệch phía sau.
- Click vùng trống tạo gió nhẹ trên mảnh nền. Hiệu ứng tối đa 4 đợt, tự hết sau 1.8 giây, không đổi than, năng lượng hoặc AIR LOAD.
- Bố cục thay đổi vừa phải theo seed; vẫn giữ 1–2 nhà máy phía dưới.

Kiểm tra v21: Chrome headless chạy lại luồng tương tác v20, kiểm tra vật thể bắt đầu ngoài khung và tới đích, số hạt 76, gió tác động mảnh nền nhưng không đổi tiến trình, tự dọn hiệu ứng. Không có lỗi JavaScript chưa bắt trong lượt kiểm tra. Đã xem ảnh toàn cảnh.

## Nền tảng giữ từ v20
- Đúng 7 cục than đã bay vào máy sẽ đạt 100%, không phụ thuộc tốc độ bấm.
- Giữ hoạt ảnh tách bốn mảnh, hút vào miệng máy; đốt một lần khi đủ bốn mảnh.
- STAGE 1: HARM cùng hàng và cùng kiểu chữ với AIR LOAD, không còn nền đen hay viền.
- Mỗi lần reset chọn 1–2 nhà máy xuống các khoảng trống phía dưới, có biến thiên nhỏ theo seed.
- Research thay toàn bộ nội dung About cũ; giữ bảng xanh/nền sáng/viền cam và xanh lá. Chân bảng chỉ có tên và SID nhỏ.
- Ẩn giao diện nền khi xem research. Đóng bằng X, I hoặc Escape.
- 100% vẫn tự nén–xả; giữ và thả trên máy hoặc dùng Space là tùy chọn.

## Nguồn research
[1] United Nations — Causes and Effects of Climate Change:
https://www.un.org/en/node/188439

[2] UNEP & ISWA (2024) — Global Waste Management Outlook 2024:
https://www.unep.org/resources/global-waste-management-outlook-2024

Nội dung được biên tập từ chủ đề trong ảnh tham khảo; không giữ các tỷ lệ tiêu thụ nhiên liệu 1950–2025 chưa có nguồn xác nhận trong ảnh. AIR LOAD là tiến trình nghệ thuật, không phải thang đo ô nhiễm khoa học.

## Kiểm tra
Chrome headless: click than thật, bốn mảnh và một lần đốt, đúng 7 cục đến hoàn tất, bấm nhanh/chậm, tự xả, giữ/thả tùy chọn, thả chuột ngoài canvas, research mở/đóng, reset, màu HUD sau reset, giới hạn số hạt khi chạy lâu, căn nhãn tại kích thước nhỏ, bố cục 16 lần reset. Kiểm tra ảnh 1440×900 và 640×360. Các lượt này không có lỗi JavaScript chưa bắt; không khẳng định bao phủ mọi thiết bị. Một số kiểm tra dùng bước thời gian tăng tốc.

## Âm thanh — v34
- Giữ `HARM/` và `designed-sounds/` ở cùng một thư mục cha. `sound.js` dùng đường dẫn `../designed-sounds/`.
- Keyboard Reverse chỉ dùng cho hover các button; popup 100% không phát âm này.
- Mouse Click = click UI, Exhaust = mỗi lần đốt than, Microwave = machine bed, Water Tap = smoke ambience, Rice + Oral Irrigator = formation, Plastic Bag = damage, Car Signal = critical alert khi AIR LOAD vừa đạt 100%.
- Popup hậu quả vẫn xuất hiện sau 5 giây và không có sound cue riêng.
- SOUND MIX có MASTER + 9 channel sliders, MUTE và USE RECOMMENDED. Mức âm được lưu bằng localStorage.

Các tài liệu refinement đi kèm chỉ là ghi chú lịch sử.


## v35 layered soundscape
- Soundscape attempts to begin immediately with a very quiet Water Tap bed. Browsers that block audible autoplay begin it on the first user gesture.
- Before coal interaction, sparse Rice / Oral Irrigator / Exhaust details create a subtle industrial environment.
- AIR LOAD 100% uses the full Microwave recording as the hero machine climax, supported by low Exhaust, Car Signal, Irrigator and Plastic textures.
- The delayed completion popup remains silent.
- AMBIENCE is independently adjustable in the sound mixer, in addition to Master and per-sound levels.


## v36 sound refinement
- Sound mixer labels now use the supplied recording names: Keyboard Reverse, Mouseclick, Exhaust, Microwave, Water Tap, Rice, Oral Irrigator, PlasticBag, and Car Signal.
- Smoke is no longer represented by Water Tap alone. Water Tap is a quiet, rate-drifting bed, with irregular low Exhaust breaths and occasional Oral Irrigator hiss as pollution rises.
- Smoke texture layers use independent ambient voices, so they do not interrupt interaction cues.


## Sound refinement v37
- Fresh page load starts SOUND ON at the recommended mix.
- Coal fracture has a short Rice + PlasticBag granular crack, followed ~110 ms later by Exhaust/Microwave machine response.
- Coal no longer stacks the generic Mouseclick cue, keeping the interaction cleaner.
