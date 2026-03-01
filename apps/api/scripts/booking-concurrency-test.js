/* eslint-disable no-console */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
const BUSINESS_ID = process.env.TEST_BUSINESS_ID;
const SERVICE_ID = process.env.TEST_SERVICE_ID;
const START_TIME = process.env.TEST_START_TIME;
const STAFF_ID = process.env.TEST_STAFF_ID;
const COUNTRY = process.env.TEST_COUNTRY ?? 'DE';

function required(name, value) {
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

async function loginAndGetToken() {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: required('TEST_EMAIL', EMAIL),
      password: required('TEST_PASSWORD', PASSWORD)
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${JSON.stringify(payload)}`);
  }
  return payload.tokens.accessToken;
}

async function createBooking(token) {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      businessId: required('TEST_BUSINESS_ID', BUSINESS_ID),
      serviceId: required('TEST_SERVICE_ID', SERVICE_ID),
      startTime: required('TEST_START_TIME', START_TIME),
      ...(STAFF_ID ? { staffId: STAFF_ID } : {}),
      country: COUNTRY
    })
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const token = await loginAndGetToken();
  const [a, b] = await Promise.all([createBooking(token), createBooking(token)]);

  const results = [a, b];
  const successCount = results.filter((r) => r.ok).length;
  const conflictCount = results.filter((r) => !r.ok && r.body?.errorCode === 'BOOKING_CONFLICT').length;

  console.log('Result A:', a);
  console.log('Result B:', b);
  console.log({ successCount, conflictCount });

  if (successCount === 1 && conflictCount === 1) {
    console.log('PASS: exactly one success and one BOOKING_CONFLICT');
    process.exit(0);
  }

  console.error('FAIL: expected one success and one BOOKING_CONFLICT');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
