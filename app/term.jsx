import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function Terms() {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
         <Image
           source={require("../assets/back.png")}
           style={styles.backIcon}/>
        </TouchableOpacity>

        <Text style={styles.title}>Terms & Conditions</Text>
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.content}>
        <Text style={styles.text}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.{"\n\n"}

          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.{"\n\n"}

          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.{"\n\n"}

          Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.{"\n\n"}

          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.{"\n\n"}

          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.{"\n\n"}

          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
        </Text>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
  },

  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  back: {
    color: "#386BF6",
    fontSize: 16,
    marginBottom: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F1F5A",
  },

  content: {
    paddingHorizontal: 20,
  },

  text: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },
  backIcon: {
   width: 20,
   height: 20,
   resizeMode: "contain",
},
});