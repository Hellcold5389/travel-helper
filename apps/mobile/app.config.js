module.exports = {
  expo: {
    name: "Travel Helper",
    slug: "travel-helper",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.travelhelper.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#3B82F6"
      },
      package: "com.travelhelper.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      // Google Sign-In 和 Apple Sign-In 暂时禁用，等配置 OAuth 后启用
      // [
      //   "@react-native-google-signin/google-signin",
      //   {
      //     iosUrlScheme: "com.googleusercontent.apps.YOUR_CLIENT_ID"
      //   }
      // ],
      // "@invertase/react-native-apple-authentication"
    ],
    extra: {
      // 等配置 OAuth 后填写
      // googleWebClientId: "YOUR_WEB_CLIENT_ID",
      // googleIosClientId: "YOUR_IOS_CLIENT_ID"
    }
  }
};
