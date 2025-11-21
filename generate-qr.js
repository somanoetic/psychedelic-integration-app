const QRCode = require('qrcode');
const fs = require('fs');

const androidApkUrl = 'https://expo.dev/artifacts/eas/btKEUtWnsJyEYxJFRrm9KY.apk';

// Generate QR code as PNG
QRCode.toFile('qr-code-android-direct.png', androidApkUrl, {
  width: 400,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}, (err) => {
  if (err) {
    console.error('Error generating QR code:', err);
  } else {
    console.log('QR code generated successfully: qr-code-android-direct.png');
    console.log('URL encoded:', androidApkUrl);
  }
});
