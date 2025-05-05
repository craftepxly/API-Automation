// Mungkin masih ada error, karena ini dibuat dalam waktu 2 jam sebelum deadline (tanggal 5)

import request from 'supertest';
import { expect } from 'chai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Validasi variabel lingkungan
if (!process.env.USERNAME || !process.env.PASSWORD) {
  throw new Error('Environment variables USERNAME dan PASSWORD harus disetel di .env');
}

const BASE_URL = process.env.BASE_URL || 'https://restful-booker.herokuapp.com';
const api = request(BASE_URL);

describe('Automasi Pengujian API Restful Booker', function() {
  this.timeout(5000);
  let token;
  let bookingId;
  const bookingData = JSON.parse(
    fs.readFileSync('data/booking.json', 'utf-8')
  );

  before('Mendapatkan token autentikasi', async function() {
    // Permintaan token ke endpoint /auth
    const response = await api
      .post('/auth')
      .set('Content-Type', 'application/json')
      .send({
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      });

    // Pastikan status respons adalah 200
    expect(response.status).to.equal(200, `Status authentication bukan 200, melainkan ${response.status}`);

    // Jika ada alasan kegagalan, tampilkan pesan yang jelas
    if (response.body.reason) {
      throw new Error(`Gagal autentikasi: ${response.body.reason}`);
    }

    expect(response.body).to.have.property('token', undefined, 'Respons tidak mengandung properti token');
    token = response.body.token;
  });

  it('Membuat booking baru', async function() {
    // Mengirim data booking dan menyimpan bookingId
    const response = await api
      .post('/booking')
      .set('Content-Type', 'application/json')
      .send(bookingData);

    expect(response.status).to.equal(200);
    expect(response.body).to.include.keys('bookingid', 'booking');

    bookingId = response.body.bookingid;

    // Verifikasi struktur dan isi booking
    const booking = response.body.booking;
    expect(booking).to.include.all.keys(
      'firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates', 'additionalneeds'
    );
    expect(booking).to.deep.include(bookingData);
  });

  it('Memverifikasi data booking', async function() {
    const response = await api
      .get(`/booking/${bookingId}`)
      .set('Accept', 'application/json');

    expect(response.status).to.equal(200);
    expect(response.body).to.deep.include(bookingData);
  });

  it('Menghapus booking', async function() {
    const response = await api
      .delete(`/booking/${bookingId}`)
      .set('Cookie', `token=${token}`);

    expect(response.status).to.equal(201);
  });
});