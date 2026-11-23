'use client';

/**
 * Batas galat terakhir: hanya dipakai bila root layout ikut gagal, sehingga
 * harus merender <html> dan <body> sendiri. Ditulis tanpa dependensi styling
 * aplikasi agar tetap tampil walau CSS belum termuat.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8f7f4',
          color: '#1c1917',
          padding: '24px',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px' }}>Aplikasi gagal dimuat</h1>
          <p style={{ margin: '0 0 20px', color: '#57534e', lineHeight: 1.6 }}>
            Terjadi gangguan tak terduga. Muat ulang halaman; bila masih gagal, kembali beberapa
            saat lagi.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: '9999px',
              background: '#115e59',
              color: '#ffffff',
              padding: '10px 20px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Muat ulang
          </button>
          <p style={{ marginTop: '16px', fontSize: '0.75rem', color: '#a8a29e' }}>
            {error.digest ? `Kode kejadian: ${error.digest}` : null}
          </p>
        </main>
      </body>
    </html>
  );
}
