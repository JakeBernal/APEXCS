import { Tabs } from "expo-router";
import BottomNav from "../components/bottomNav";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="exams" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="profile" />

    
    </Tabs>
  );
}