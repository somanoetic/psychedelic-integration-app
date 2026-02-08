# ADR-002: Use React Native + Expo for Mobile Development

**Date:** 2026-02-08 (Retrospective - original decision ~2023)
**Status:** Accepted
**Deciders:** Project Lead

---

## Context

We needed to build a mobile application for psychedelic integration that would:
- Support both iOS and Android platforms
- Be maintainable by a small team (1-2 developers)
- Iterate quickly during early development
- Include complex features (AI chat, journaling, nervous system tracking)
- Have excellent UI/UX with custom designs
- Be deployable to app stores

The team had experience with web development (React) but limited native mobile experience.

---

## Decision

Use **React Native 0.81.5** with **Expo ~54.0.25** as the primary mobile development framework.

### Key Components:
- **React Native**: Core framework for building mobile apps
- **Expo**: Managed workflow and tooling layer
- **React Navigation**: Navigation (stack + bottom tabs)
- **React Native Paper**: UI component library
- **Expo modules**: Camera, fonts, secure storage, updates, etc.

---

## Rationale

### Why React Native:
1. **Code Reusability**: Single codebase for iOS and Android (~95% shared code)
2. **Team Skills**: Leverage existing React/JavaScript expertise
3. **Performance**: Near-native performance for most use cases
4. **Ecosystem**: Large community, extensive libraries
5. **Mature Platform**: Proven at scale (Facebook, Instagram, Discord, etc.)

### Why Expo:
1. **Development Speed**: No need to configure native build tools initially
2. **OTA Updates**: Push fixes without app store review
3. **Simplified Workflow**: Managed native dependencies
4. **Easy Testing**: Expo Go app for quick device testing
5. **Build Services**: EAS Build for production releases
6. **Solo-friendly**: Reduces complexity for small teams

### Why This Stack Fits:
- **Integration-focused app**: Not performance-critical (gaming/AR)
- **Content-heavy**: Journaling, text, educational material
- **Conversational UI**: AI chat interfaces work well in React Native
- **Rapid iteration**: Early-stage product needs quick changes
- **Budget-conscious**: Single team for both platforms

---

## Consequences

### Positive ✅
- Shipped cross-platform app with small team
- Fast iteration cycles (fix bugs → deploy in hours via OTA)
- Easy onboarding for developers with React experience
- Rich ecosystem of libraries for most needs
- Expo Go enables easy testing on real devices
- Single codebase reduces maintenance burden significantly

### Negative ⚠️
- **Performance limitations**: Some animations less smooth than native
- **Bundle size**: JavaScript bundle can be large
- **Native modules**: Some features require ejecting from Expo
- **App size**: React Native apps larger than native equivalents
- **Debugging complexity**: Bridge between JS and native can complicate debugging
- **Expo limitations**: Some native features not available in managed workflow

### Neutral ℹ️
- Expo SDK version updates require coordination (breaking changes)
- Need to stay within Expo's supported feature set or eject
- OTA updates have limitations (can't update native code)
- Development server needs stable network for testing

---

## Alternatives Considered

### Option 1: Native Development (Swift/Kotlin)
**Pros**: Best performance, full platform features, optimal UX
**Cons**: Need 2 separate teams, 2x development time, 2x maintenance
**Why not chosen**: Too resource-intensive for small team, not justified for content app

### Option 2: Flutter
**Pros**: Good performance, single codebase, growing ecosystem
**Cons**: Dart language (new learning curve), smaller community than RN, less mature for complex apps
**Why not chosen**: Team had React experience, ecosystem less mature at decision time

### Option 3: Progressive Web App (PWA)
**Pros**: Web technologies, no app store friction, instant updates
**Cons**: No offline-first features, limited native capabilities, worse UX for mobile-first app
**Why not chosen**: Need offline journaling, better mobile-first UX

### Option 4: Ionic/Capacitor
**Pros**: Web technologies, works with React
**Cons**: WebView performance issues, less native feel
**Why not chosen**: React Native offers better performance and native feel

### Option 5: React Native without Expo (Bare Workflow)
**Pros**: Full native control, no Expo limitations
**Cons**: Complex setup, need Xcode/Android Studio expertise, slower iteration
**Why not chosen**: Expo's benefits outweigh limitations for our use case; can eject later if needed

---

## Implementation Notes

### Expo Workflow:
- Using **Expo Managed Workflow** initially
- Can eject to Bare Workflow if native features needed
- EAS Build for production builds
- Expo Updates for OTA deployments

### Dependencies Management:
- Stick to Expo-compatible libraries when possible
- Check compatibility before adding new native dependencies
- Use `expo install` to ensure version compatibility

### Deployment Strategy:
- Development: Expo Go + local server
- Internal testing: EAS Build internal distribution
- Production: EAS Build → App Store/Play Store
- OTA updates for JS-only changes

### Known Limitations:
- Some AI features may need optimization for mobile
- Large journal datasets may need pagination/virtualization
- Background tasks limited in managed workflow

---

## Migration Path (Future)

If we need to eject from Expo:
1. Use `expo prebuild` to generate native projects
2. Move to Bare Workflow gradually
3. Continue using Expo modules we need
4. Gain ability to add any native code

When to consider ejecting:
- Need native features not supported by Expo
- Performance bottlenecks in Expo's managed layer
- Need deep iOS/Android customizations
- Team grows to support native developers

---

## References

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Why Discord uses React Native](https://discord.com/blog/why-discord-is-sticking-with-react-native)
- Project: package.json for exact versions

---

## Review

**Works Well:**
- ✅ Shipped app cross-platform with 1 developer
- ✅ Rapid iteration and bug fixes
- ✅ OTA updates critical for quick fixes
- ✅ Expo Go simplifies device testing
- ✅ Good performance for content-focused app

**Challenges:**
- ⚠️ Some animation performance issues (glimmers swiper)
- ⚠️ Expo SDK updates can break things
- ⚠️ Bundle size optimization needed
- ⚠️ Navigation state management complexity

**Would Choose Again:** ✅ Yes
For a solo dev building a content-focused cross-platform app, this stack is ideal.

**Next Review:** 2026-06-01 (after 6 months of production use)

---

**Status:** Accepted and Validated
**Production Since:** 2025-10 (estimate)
**Current Version:** React Native 0.81.5, Expo 54.0.25
