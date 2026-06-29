# MAHA289 Telegram Widget VS Code Starter

ไฟล์ชุดนี้ทำไว้ให้เปิดแก้บน VS Code ได้ทันที

## เปิดใช้งานเร็ว
1. แตก ZIP
2. เปิดโฟลเดอร์นี้ด้วย VS Code
3. เปิด `index.html` ใน Browser
4. เข้าไฟล์ `step4.html` ถึง `step7.html`
5. ค้นคำว่า `data-telegram-post`
6. เปลี่ยนค่า เช่น `bn9game/45` เป็นโพสต์ Telegram จริงของพี่

## วิธีเอาเลขโพสต์ Telegram
ถ้าลิงก์โพสต์คือ:
https://t.me/bn9game/45

ให้ใช้ค่า:
bn9game/45

แล้ววางตรงนี้:
data-telegram-post="bn9game/45"

## จุดที่ต้องแก้ในแต่ละไฟล์
- `step4.html` ใช้ placeholder `bn9game/45`
- `step5.html` ใช้ placeholder `bn9game/46`
- `step6.html` ใช้ placeholder `bn9game/47`
- `step7.html` ใช้ placeholder `bn9game/48`

## ถ้าโพสต์ไม่ขึ้น เช็กเร็ว
1. Channel ต้องเป็น Public
2. โพสต์ต้องเปิดผ่าน browser ได้
3. เลขโพสต์ต้องถูก
4. เครื่องต้องต่ออินเทอร์เน็ต เพราะ widget โหลด script จาก `telegram.org`

## หมายเหตุ
- โฟลเดอร์ `original/` คือไฟล์เดิมก่อนแก้ เผื่อย้อนกลับ
- ไฟล์ใน `assets/` เป็นรูป placeholder เปลี่ยนทับด้วยรูปจริงได้เลย
