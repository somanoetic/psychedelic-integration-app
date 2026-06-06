import 'dotenv/config';

export default {
  "expo": {
    "name": "Multitudes",
    "slug": "psychedelic-integration-app",
    "version": "1.2.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F5F1E8"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.psycheteleosapp",
      "buildNumber": "5",
      "runtimeVersion": {
        "policy": "appVersion"
      },
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Multitudes uses your microphone to let you talk with Huxley during voice sessions. Audio is sent to our secure server for transcription and is not stored after your session.",
        "NSCameraUsageDescription": "Multitudes uses your camera to scan handwritten worksheets and journal pages so the app can save and reflect on what you wrote.",
        "NSPhotoLibraryUsageDescription": "Multitudes can pick a previously taken photo of a worksheet or journal page from your library to add to your reflections."
      }
    },
    "android": {
      "package": "com.anonymous.psycheteleosapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F5F1E8"
      },
      "runtimeVersion": "1.2.0",
      "softwareKeyboardLayoutMode": "resize",
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.CAMERA"
      ]
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/images/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "51f2a410-267f-47c9-a2c8-f77b168d782c"
      },
      "supabaseUrl": process.env.SUPABASE_URL || '',
      "supabaseAnonKey": process.env.SUPABASE_ANON_KEY || '',
      "sentryDsn": process.env.SENTRY_DSN || ''
    },
    "owner": "alleviationtherapeutics",
    "updates": {
      "url": "https://u.expo.dev/51f2a410-267f-47c9-a2c8-f77b168d782c"
    },
    "plugins": [
      "expo-secure-store",
      "expo-font",
      "expo-mail-composer",
      [
        "expo-audio",
        {
          "microphonePermission": "Multitudes uses your microphone to let you talk with Huxley during voice sessions."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Multitudes uses your camera to scan handwritten worksheets and journal pages."
        }
      ]
    ]
  }
};
