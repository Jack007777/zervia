# Zervia API Contracts (MVP Extensions)

## Base
- API base: `/api/v1` (NestJS backend)
- Web fallback MVP endpoint: `/api/partner-leads` (Next.js route)

## 1) Search

### Request
`GET /api/v1/search?category=massage&city=Berlin&zip=10115&date=2026-03-05&sort=rating&availableTime=evening&serviceFor=women&priceMin=40&priceMax=120&ratingMin=4&page=1&limit=10`

### Response 200
```json
{
  "items": [
    {
      "_id": "m1",
      "slug": "luna-beauty-berlin",
      "name": "Luna Beauty Berlin",
      "category": "kosmetik",
      "addressLine": "Torstrasse 88, 10119 Berlin",
      "city": "Berlin",
      "area": "Mitte",
      "avgRating": 4.8,
      "reviewCount": 214,
      "priceMin": 45,
      "priceMax": 139,
      "distanceKm": 1.4,
      "earliestSlot": "2026-03-05T10:30:00+01:00",
      "tags": ["Gesichtsbehandlung", "Hydra Facial"]
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 42
}
```

## 2) Business Detail

### Request
`GET /api/v1/business/:id`

### Response 200
```json
{
  "_id": "m1",
  "slug": "luna-beauty-berlin",
  "name": "Luna Beauty Berlin",
  "description": "Specialized in facials and brow styling.",
  "addressLine": "Torstrasse 88, 10119 Berlin",
  "city": "Berlin",
  "country": "DE",
  "avgRating": 4.8,
  "reviewCount": 214,
  "openingHours": [
    { "day": "Mon", "open": "09:00", "close": "19:00" }
  ],
  "cancellationPolicy": "Free cancellation up to 24h before appointment."
}
```

## 3) Reviews

### Request
`GET /api/v1/business/:id/reviews?page=1&limit=10&sort=latest`

### Response 200
```json
{
  "items": [
    {
      "_id": "r1",
      "businessId": "m1",
      "rating": 5,
      "text": "Very clean studio and excellent service.",
      "author": "Anna K.",
      "createdAt": "2026-02-20T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 214,
  "aggregate": {
    "avgRating": 4.8,
    "reviewCount": 214
  }
}
```

## 4) Booking Create (guest-ready contract)

### Request
`POST /api/v1/bookings`
```json
{
  "businessId": "m1",
  "serviceId": "s1",
  "startTime": "2026-03-05T10:30:00+01:00",
  "country": "DE",
  "guest": {
    "name": "Max Mustermann",
    "phone": "+4917612345678",
    "email": "max@example.com"
  }
}
```

### Response 201
```json
{
  "_id": "b101",
  "status": "pending",
  "businessId": "m1",
  "serviceId": "s1",
  "startTime": "2026-03-05T10:30:00+01:00",
  "endTime": "2026-03-05T11:30:00+01:00",
  "smsNotification": "queued"
}
```

## 5) Partner lead (MVP capture)

### Request
`POST /api/partner-leads`
```json
{
  "businessName": "Studio Nova",
  "contactName": "Sara Klein",
  "phone": "+4917611122233",
  "city": "Berlin",
  "serviceCategory": "massage",
  "locale": "de",
  "country": "DE"
}
```

### Response 200
```json
{
  "leadId": "98b83dd0-27f6-41eb-b95f-b26fbd766f8b",
  "received": true,
  "createdAt": "2026-03-02T10:00:00.000Z",
  "message": "Lead captured (MVP). Wire to CRM/DB in production."
}
```

## Error envelope
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Missing required fields",
  "details": []
}
```
