# Nadoda Connect — Mobile Application (React Native / Expo)

A high-performance, modern, Instagram-inspired mobile application built with **React Native** and **Expo** for the **Nadoda Rajput Community**.

---

## 📱 Features

- **Instagram-Inspired UI/UX**:
  - Sleek dark aesthetic (`#0B1120`, `#0F172A`, `#182235`), glowing avatar rings with royal crowns for family heads.
  - Snappy 60fps virtualized feed cards and an intuitive bottom navigation bar.
- **Village Hierarchy (વંશાવળી)**:
  - **Level 1**: Searchable Atak list with Kuldevi names and family count badges.
  - **Level 2**: Searchable family cards with house numbers, head names, addresses, and member counts.
  - **Level 3**: Full family roster with member cards, "+ સભ્ય ઉમેરો" (Add Member), and "કુટુંબ સુધારો" (Edit Family).
  - Deep-link jumping directly to Level 3 from member search results.
- **Directory / All Members (તમામ સભ્યો)**:
  - Instant fuzzy search across Gujarati & English names, mobile numbers, ataks, occupations, and cities.
  - Quick filter chips: All, Male (`પુરુષ`), Female (`સ્ત્રી`), Family Head only (`વડીલ માત્ર`), and specific Ataks.
  - **1-tap Phone Call** and **1-tap WhatsApp** direct messaging buttons.
  - "કુટુંબ જુઓ" (View Family) jump button.
- **My Family (મારું કુટુંબ)**:
  - Dedicated family view for the logged-in member with complete roster and self-service editing.
- **Statistics & Demographics (આંકડા)**:
  - 6 KPI Summary Cards: Total Houses, Population, Male, Female, Sex Ratio, and Avg Family Size.
  - Interactive visual distribution charts for Age groups (0-18, 19-35, 36-60, 60+), Top Occupations, Work Cities, and Marital Status.
  - Live Database Recalculate button.
- **Admin Portal (વહીવટ)**:
  - User management: create login accounts from eligible members, assign roles (`super_admin`, `village_admin`, `member`), and set passwords.
  - Real-time active sessions monitoring with device/browser info and 1-tap remote session termination.
- **Full Profile Sheet (વિગતવાર પ્રોફાઇલ)**:
  - Comprehensive bottom sheet modal displaying personal, contact, education, career, matrimonial metadata, and directory verification status.

---

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK
- **Navigation & Storage**: `@react-native-async-storage/async-storage`
- **UI Elements**: `@expo/vector-icons` (`Ionicons`, `FontAwesome5`, `MaterialCommunityIcons`), `expo-linear-gradient`
- **Networking**: Fetch / Axios API client with automatic JWT token management

---

## ⚙️ API Configuration

The mobile app connects to the live production backend API by default:
```
https://nadoda-connect-backend.onrender.com/api
```

To configure a local backend URL when testing on a local emulator, update `BASE_URL` in [src/api/client.js](file:///e:/Projects/nadoda-connect/mobile/src/api/client.js):
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **Physical Device on Same Wi-Fi**: `http://<your-computer-local-ip>:5000/api`

---

## 🚀 Running the App

### Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/client) app installed on your Android or iPhone device

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Development Server
```bash
npm start
```
Scan the QR code printed in your terminal using the **Expo Go** app (Android) or the default Camera app (iOS) to launch the app instantly on your phone.

### Platform-specific shortcuts
```bash
npm run android   # Open in connected Android device / emulator
npm run ios       # Open in iOS simulator (macOS only)
npm run web       # Open preview in web browser
```

---

## 🏗️ Architecture

```
mobile/
├── App.js                   # Root App component with AuthProvider & Modals
├── index.js                 # Expo root registry
├── package.json             # Expo SDK & React Native dependencies
└── src/
    ├── api/
    │   ├── client.js        # API client with JWT token injection & AsyncStorage
    │   └── index.js         # Backend API services (auth, village, family, member)
    ├── context/
    │   └── AuthContext.js   # Session state, login/logout, village selector & RBAC
    ├── theme/
    │   └── colors.js        # Dark theme tokens, semantic palettes & gradients
    ├── components/
    │   ├── Header.js        # Compact top bar with village picker & profile menu
    │   ├── BottomTabBar.js  # Instagram-style bottom tab bar
    │   ├── MemberCard.js    # Interactive feed card with call, WhatsApp, and family jump
    │   ├── MemberDetailModal.js # Comprehensive profile sheet
    │   ├── MemberFormModal.js   # Member create / edit modal
    │   ├── FamilyFormModal.js   # Family create / edit modal
    │   └── ChangePasswordModal.js # Password change dialog
    └── screens/
        ├── LoginScreen.js       # Fast mobile & password login
        ├── HierarchyScreen.js   # 3-level tree navigation with deep linking
        ├── MembersScreen.js     # Filterable members directory
        ├── MyFamilyScreen.js    # Family roster & self-service
        ├── StatsScreen.js       # Community demographics & recalculate
        └── AdminScreen.js       # Users & Active sessions management
```
