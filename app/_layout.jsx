import { Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const prepare = async () => {
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}