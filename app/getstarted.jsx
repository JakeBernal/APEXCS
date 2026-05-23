import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Your Civil Service Exam Reviewer",
    subtitle: "Anytime, Anywhere.",
    image: require("../assets/test-amico.png"),
  },
  {
    id: "2",
    title: "Practice Real Exam Questions",
    subtitle: "Boost your confidence daily.",
    image: require("../assets/Mathematics-bro.png"),
  },
];

export default function GetStarted() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
      });
    } else {
      console.log("Navigate to Home/Login");
    }
  };

  const updateCurrentSlideIndex = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const SlideItem = ({ item }) => {
    return (
      <View style={styles.slide}>

        {/* TEXT */}
        <View style={styles.textWrapper}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>

        {/* IMAGE */}
        <View style={styles.img1}>
          <Image
            source={item.image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
        
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <Text style={styles.skip}>Skip</Text>
        </View>

      {/* FIXED LOGO */}
      <View style={styles.fixedLogo}>
        <Text style={styles.apex}>APEX</Text>
        <Text style={styles.cs}>cs</Text>
      </View>

      {/* SLIDER */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item }) => <SlideItem item={item} />}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        keyExtractor={(item) => item.id}
      />

      {/* DOTS */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* BUTTON */}
   <TouchableOpacity
    style={styles.btn}
     onPress={() => {
     if (currentIndex >= slides.length - 1) {
      router.push("/readytostart");
     } else {
      handleNext();
     }
    }}>
    <Text style={styles.btnText}>
     {currentIndex >= slides.length - 1 ? "Get Started" : "Next"}
     </Text>
    </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* FIXED LOGO */
  fixedLogo: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 10,
    marginTop:30
  },

  apex: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 3,
  },

  cs: {
    fontSize: 17,
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: 14,
    marginLeft: 2,
    color: "#386BF6",
  },

  slide: {
    width: width,
    paddingTop: 120,
  },

  topBar: {
    position: "absolute",
    top: 70,
    right: 25,
    zIndex: 20,
  },

  skip: {
    color: "#386BF6",
    fontSize: 16,
    fontWeight: "600",
    
  },

  textWrapper: {
    alignItems: "center",
    marginTop: 90,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1F5A",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },

  img1: {
    alignItems: "center",
    marginTop: 10,
  },

  image: {
    width: 320,
    height: 420,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: "#386BF6",
    width: 10,
    height: 10,
  },

  btn: {
    backgroundColor: "#386BF6",
    marginHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 10,
    alignSelf: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 80,
    width: 320,
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});