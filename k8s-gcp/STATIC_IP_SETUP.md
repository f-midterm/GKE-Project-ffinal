# Static IP Setup for GKE Deployment

## วิธีสร้าง Static IP (ทำครั้งเดียว)

### 1. สร้าง Global Static IP
```powershell
gcloud compute addresses create beliv-ip --global
```

### 2. ดู IP Address ที่ได้
```powershell
gcloud compute addresses describe beliv-ip --global --format="value(address)"
```
จะได้ IP เช่น: `34.120.45.67`

### 3. ตั้งค่า DNS A Record
ไปที่ DNS provider (Cloudflare/GoDaddy/etc.) แล้วเพิ่ม:
- **Type**: A
- **Name**: beliv.muict.app
- **Value**: `34.120.45.67` (IP จากข้อ 2)
- **TTL**: Auto หรือ 300
- **Proxy**: ❌ DNS only (ปิด Cloudflare proxy)

### 4. ตรวจสอบ DNS (รอ 1-5 นาที)
```powershell
nslookup beliv.muict.app
# ควรได้ IP ที่ตรงกับ Static IP
```

### 5. Deploy ได้เลย!
```powershell
.\deploy.ps1
```

---

## ข้อดีของ Static IP

✅ **Deploy ครั้งเดียวเสร็จ** - ไม่ต้องรอ IP แล้ว deploy ใหม่  
✅ **Certificate ทำงานได้ทันที** - GKE รู้ IP ตั้งแต่แรก  
✅ **IP ไม่เปลี่ยน** - ลบ Ingress แล้วสร้างใหม่ก็ได้ IP เดิม  
✅ **ง่ายต่อการจัดการ DNS** - ตั้งครั้งเดียวใช้ตลอด  

---

## การจัดการ Static IP

### ดู Static IP ทั้งหมด
```powershell
gcloud compute addresses list --global
```

### ลบ Static IP (ถ้าไม่ใช้แล้ว)
```powershell
gcloud compute addresses delete beliv-ip --global
```
⚠️ **หมายเหตุ**: Static IP คิดเงินถ้าไม่ได้ใช้งาน (~$0.01/hr)  
แต่ถ้า Ingress ใช้อยู่ = ฟรี

---

## Troubleshooting

### ปัญหา: Certificate ไม่ทำงาน (Status: ProvisioningFailed)
**สาเหตุ**: DNS ไม่ชี้ไปที่ Static IP
```powershell
# ตรวจสอบ DNS
nslookup beliv.muict.app

# ตรวจสอบ Static IP
gcloud compute addresses describe beliv-ip --global --format="value(address)"

# ต้องตรงกัน!
```

### ปัญหา: Ingress ไม่ได้ใช้ Static IP
**สาเหตุ**: Annotation ไม่ถูกต้อง
```yaml
# ingress.yaml ต้องมี:
metadata:
  annotations:
    kubernetes.io/ingress.global-static-ip-name: "beliv-ip"
```

### ปัญหา: Static IP ยังไม่ได้สร้าง
```powershell
# Script จะแจ้งเตือนและบอกวิธีสร้าง
.\deploy.ps1
# Error: Static IP 'beliv-ip' not found!
# Create it first:
#   gcloud compute addresses create beliv-ip --global
```
