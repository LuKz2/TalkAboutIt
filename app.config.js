export default {
  "expo": {
    "name": "TalkAboutIt",
    "slug": "TalkAboutIt",
    "plugins": [
      "@notifee/react-native",
      "expo-secure-store",
      "react-native-iap"
    ],
    "version": "2.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/logo_semfundo.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.talkaboutit",
      "googleServicesFile": "./src/services/GoogleService-Info.plist"
    },
    "android": {
      "package": "com.talkaboutit",
      "permissions": [
        "com.android.vending.BILLING"
      ],
      "versionCode": 16,
      "googleServicesFile": "./android/app/google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#000000"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "3f66ced1-55f9-4a1b-a8cf-abbef5714925"
      }
    },
    "plugins": [
      [
        "react-native-fbsdk-next",
        {
          "appID": "722283933388872",
          "clientToken": "cdf4e83d82d543716868b67ec2f066d3",
          "displayName": "TalkAboutIt",
          "scheme": "fb722283933388872",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false,
          "isAutoInitEnabled": true,
          "iosUserTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ],
      "expo-tracking-transparency"
    ],
    "developmentClient": {
      "startOnLaunch": true
    }
  }
}
