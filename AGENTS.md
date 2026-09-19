# Project Guidelines

## Overview
This repository is a React Native / Expo application built with Expo Router and Supabase.

<!-- antislop:start -->
## antislop
For any UI, styling, copy, accessibility, mobile layout, or code comment work, always adhere to the `antislop` system:
- **Core Filter & Delivery Gate**: `antislop`
- **UI & Visual Design**: `antislop-ui`
- **Copywriting & Tone**: `antislop-copywriting`
- **Accessibility & Contrast**: `antislop-human`
- **Mobile & Touch Layouts**: `antislop-layoutmobile`
- **Code Comments**: `antislop-code`

### Rules & Guidelines
1. **No Dead Controls**: Every `Pressable`, `TouchableOpacity`, button, modal, or input must have functional behavior or clear state management.
2. **Mobile First & Touch Targets**: Ensure all interactive tap targets are at least 44x44 points and layouts handle safe areas gracefully (`react-native-safe-area-context`).
3. **Contrast & States**: Ensure text meets WCAG AA contrast standards, and include empty, loading, and error states for asynchronous data.
4. **Honest Copy & Content**: Avoid buzzwords ("revolutionary", "seamless"), em dashes (`�`), and fabricated numbers or reviews.
5. **Purpose-Driven Styling**: Avoid stacked decorative trends (e.g. indiscriminate glows, arbitrary gradients) without a defined design reason.
<!-- antislop:end -->
