# Redis Cache Implementation Guide

Panduan ini menjelaskan cara menerapkan Redis Upstash sebagai cache layer untuk API backend baru di project ini.

## File Utama

- Konfigurasi Redis: `src/config/env.js`
- Helper cache Redis: `src/utils/redis.js`
- Startup connection check: `src/server.js`
- Pemasangan cache/invalidation: file `*.routes.js` pada module terkait

Redis dibuat dari package:

```js
import { Redis } from '@upstash/redis';
```

Instance Redis diekspor dari `src/config/env.js` sebagai `redis`. URL dan token bisa dibaca dari env:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Jika env tidak tersedia, config saat ini memakai fallback credential yang sudah ada di `env.js`.

## Startup Behavior

Saat server startup, `src/server.js` memanggil:

```js
await initializeRedis();
```

Log yang diharapkan:

```txt
✅ Redis Connected
```

atau:

```txt
❌ Redis Not Connected
```

Jika Redis gagal terkoneksi, aplikasi tetap berjalan normal memakai database. Cache middleware akan fallback ke flow database.

## Cache Aside Pattern

Gunakan pola cache aside untuk endpoint GET:

1. Request GET masuk.
2. Middleware cek cache Redis.
3. Jika cache ada, return response cache.
4. Jika cache tidak ada, lanjut ke controller/service/database.
5. Response sukses dari database disimpan ke Redis.
6. Request GET berikutnya bisa membaca dari cache.

Helper yang digunakan:

```js
import { cacheResponse, invalidateCache } from '../../utils/redis.js';
```

## Cara Menambahkan Cache GET

Tambahkan `cacheResponse(resourceKey)` sebelum controller handler pada route GET.

Contoh:

```js
router.get('/', cacheResponse('products'), (req, res, next) =>
  controller.getProducts(req, res, next),
);
```

Contoh dengan params:

```js
router.get('/:productId', cacheResponse('products'), (req, res, next) =>
  controller.getProduct(req, res, next),
);
```

Cache key otomatis memasukkan:

- resource key
- `req.user.id`
- request path
- route params
- query params

Jadi endpoint dengan pagination/filter seperti `?page=1&limit=10` tidak akan tertukar dengan query lain.

## Cara Menambahkan Invalidation Untuk Mutasi

Untuk operasi yang mengubah data, pasang `invalidateCache(resourceKey)` sebelum controller handler.

Operasi yang harus invalidasi:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

Contoh:

```js
router.post(
  '/',
  invalidateCache(['products']),
  (req, res, next) => controller.createProduct(req, res, next),
);
```

Contoh update:

```js
router.put(
  '/:productId',
  invalidateCache(['products']),
  (req, res, next) => controller.updateProduct(req, res, next),
);
```

Penting: jangan update cache secara manual setelah mutasi. Update database dulu melalui controller/service seperti biasa, lalu invalidation akan menghapus cache jika response sukses. GET berikutnya akan membuat cache baru.

## Invalidation Untuk Data Relasional

Jika perubahan pada satu resource mempengaruhi response resource lain, invalidasi semua resource terkait.

Contoh pada table:

```js
invalidateCache(['tables', 'cms-columns', 'cms-rows', 'cms-cells'])
```

Contoh pada cell:

```js
invalidateCache(['cms-cells', 'cms-rows', 'tables'])
```

Prinsipnya: lebih baik menghapus cache terkait daripada mengembalikan data stale.

## TTL

TTL cache saat ini:

```js
const CACHE_TTL_SECONDS = 600;
```

Artinya cache berlaku selama 10 menit. Ini cocok untuk data CMS yang tidak harus realtime setiap detik, tapi tetap cukup cepat refresh setelah invalidation.

## Log Redis

Helper akan menulis log sederhana:

```txt
Redis HIT : products
Redis MISS : products
Redis INVALIDATE : products
```

Gunakan resource key yang konsisten dan mudah dibaca.

## Endpoint Yang Saat Ini Menggunakan Redis

Redis hanya diterapkan pada endpoint berikut:

- `/projects`
- `/tables`
- `/cms-columns`
- `/cms-rows`
- `/cms-cells`

Endpoint lain sengaja tidak memakai Redis karena datanya bisa perlu realtime.

## Checklist Untuk API Baru

Saat membuat API baru yang perlu Redis:

1. Tentukan resource key, misalnya `products`.
2. Import helper:

```js
import { cacheResponse, invalidateCache } from '../../utils/redis.js';
```

3. Pasang `cacheResponse('products')` pada semua GET yang boleh dicache.
4. Pasang `invalidateCache(['products'])` pada POST/PUT/PATCH/DELETE.
5. Jika data berelasi, tambahkan resource lain yang terdampak ke array invalidation.
6. Jangan ubah bentuk response API.
7. Jangan ubah frontend; Redis hanya berada di sisi backend.
8. Jalankan lint/syntax check setelah perubahan.

## Contoh Route Lengkap

```js
import { Router } from 'express';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../../utils/redis.js';

import ProductController from './product.controller.js';

const router = Router();
const controller = new ProductController();

router.use(authMiddleware);

router.get('/', cacheResponse('products'), (req, res, next) =>
  controller.getProducts(req, res, next),
);

router.get('/:productId', cacheResponse('products'), (req, res, next) =>
  controller.getProduct(req, res, next),
);

router.post(
  '/',
  invalidateCache(['products']),
  (req, res, next) => controller.createProduct(req, res, next),
);

router.put(
  '/:productId',
  invalidateCache(['products']),
  (req, res, next) => controller.updateProduct(req, res, next),
);

router.delete(
  '/:productId',
  invalidateCache(['products']),
  (req, res, next) => controller.deleteProduct(req, res, next),
);

export default router;
```

## Catatan Penting

- `invalidateCache` harus berada sebelum controller handler agar bisa membungkus `res.json`.
- Cache hanya disimpan untuk response HTTP sukses `2xx`.
- Jika Redis read/write/invalidation error, request tetap berjalan dengan database seperti biasa.
- Jangan cache endpoint yang harus selalu realtime.
