import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "DriverTouch Pop",
  slug: "drivertouch-pop",
  version: "0.5.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "drivertouchpop",
  newArchEnabled: false,
  android: {
    package: "com.drivertouch.pop",
    versionCode: 5,
    adaptiveIcon: {
      backgroundColor: "#155EEF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#155EEF",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["arm64-v8a"],
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
