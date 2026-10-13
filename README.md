# Nadoda Connect — Mobile Application (React Native / Expo)

A high-performance, modern, Instagram-inspired mobile application built with React Native and Expo for the Nadoda Rajput Samaj community directory.

## 📱 Features

- **Instagram-Inspired UI/UX**: Sleek dark aesthetic, glowing avatar rings, snappy 60fps feed cards, and a bottom navigation bar.
- **Village Hierarchy (વંશાવળી)**:
  - **Level 1**: Atak list with Kuldevi and family count badges.
  - **Level 2**: Family cards with house number, head name, address, and member counts.
  - **Level 3**: Full family roster with member cards and quick add/edit actions.
- **Directory / All Members (તમામ સભ્યો)**:
  - Instant fuzzy search (Gujarati & English name, mobile number, atak, occupation, city).
  - Quick filter chips: All, Male, Female, Family Heads only, and specific Ataks.
  - 1-tap Phone Call and WhatsApp messaging buttons.
  - Direct "કુટુંબ જુઓ" (Jump to Family) deep linking to Level 3 hierarchy.
- **My Family (મારું કુટુંબ)**:
  - Logged-in user's family roster with self-service add/edit member actions.
- **Statistics & Demographics (આંકડા)**:
  - Summary KPI cards: Total Houses, Population, Male, Female, Sex Ratio, Avg Family Size.
  - Age distribution breakdown (0-18, 19-35, 36-60, 60+).
  - Top occupations and work cities.
  - Database recalculate button.
- **Admin Portal (વહીવટ)**:
  - User management (roles: Super Admin, Village Admin, Member).
  - Create user account directly from eligible member.
  - Set / reset passwords.
  - Real-time active sessions monitoring and 1-tap remote session termination.
- **Full Profile Sheet (વિગતવાર પ્રોફાઇલ)**:
  - Personal info, family info, education, career, contact details, matrimonial metadata, and verification status.

## 🚀 Running the App

### Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/client) app installed on your Android or iPhone device

### Start Development Server
```bash
cd mobile
npm start
```
Scan the QR code printed in your terminal using the Expo Go camera (Android) or the default Camera app (iOS) to launch the app instantly on your phone.

### Platform-specific shortcuts
```bash
npm run android   # Open in connected Android device / emulator
npm run ios       # Open in iOS simulator (macOS only)
npm run web       # Open preview in web browser
```

## 🏗️ Architecture

```
mobile/
├── App.js                   # Root App component with Auth & Modals
├── package.json             # Expo SDK 52 / React Native dependencies
└── src/
    ├── api/
    │   ├── client.js        # Axios/Fetch wrapper with JWT token & dynamic base URL
    │   └── index.js         # Backend API services (auth, village, family, member)
    ├── context/
    │   └── AuthContext.js   # Session bootstrap, token storage & RBAC helpers
    ├── theme/
    │   └── colors.js        # Modern dark theme tokens & gradients
    ├── components/
    │   ├── Header.js        # Compact top bar with village picker & profile menu
    │   ├── BottomTabBar.js  # Instagram-style bottom tab bar
    │   ├── MemberCard.js    # Interactive feed card with call, WhatsApp, and family jump
    │   ├── MemberDetailModal.js # Comprehensive profile sheet
    │   ├── MemberFormModal.js   # Member create / edit modal
    │   ├── FamilyFormModal.js   # Family create / edit modal
    │   └── ChangePasswordModal.js # User password change dialog
    └── screens/
        ├── LoginScreen.js       # Fast mobile & password login
        ├── HierarchyScreen.js   # 3-level tree navigation with deep linking
        ├── MembersScreen.js     # Filterable members directory
        ├── MyFamilyScreen.js    # Family roster & self-service
        ├── StatsScreen.js       # Community demographics & recalculate
        └── AdminScreen.js       # Users & Active sessions management
```
