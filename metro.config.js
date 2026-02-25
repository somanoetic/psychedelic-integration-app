const { getDefaultConfig } = require('expo/metro-config');
const os = require('os');

const config = getDefaultConfig(__dirname);

// Force Metro to use LAN IP instead of localhost
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Skip VirtualBox and Docker IPs
        if (!iface.address.startsWith('192.168.56.') &&
            !iface.address.startsWith('192.168.99.')) {
          return iface.address;
        }
      }
    }
  }
  return null;
}

// Use environment variable if set, otherwise auto-detect
const targetIP = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || getLocalIPAddress();

if (targetIP) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Metro Bundler Configuration                          ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Hostname: ${targetIP.padEnd(42)}║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Set it for Metro to use
  if (!process.env.REACT_NATIVE_PACKAGER_HOSTNAME) {
    process.env.REACT_NATIVE_PACKAGER_HOSTNAME = targetIP;
  }
} else {
  console.warn('⚠️  Warning: Could not detect LAN IP address. Using default (localhost)');
}

module.exports = config;
