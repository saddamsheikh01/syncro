# Expats Mode – General Structure

The Expats Mode module has a separate funnel in the first phase, but afterwards uses the same structure as the Syncro platform.

## Flow

**Landing → Onboarding → Wow Page → Registration → Activation Page**

The first three steps do not require registration.

---

## 1. Public Phase (No Registration)

- **Landing Page** (`/expats`)
- **Onboarding** (relocation test) (`/expats/funnel/1` … `/expats/funnel/10`)
- **Wow Page** (personalized result) (`/expats/wow`)

All of this happens without registration. Only after the Wow Page the user is invited to register.

---

## 2. Registration

After registration:

- The user **enters Expats Mode directly**
- The **Expats Mode toggle** at the top is **active**
- The user is taken to the **Activation Page** (`/expats/activation`)

---

## 3. Activation Page

The Activation Page is the **first real page inside the platform**.

- **Figma is the final reference** for the Activation Page (icons, names, order of items).
- This new structure (icons, names, order) **must be applied to all pages of the platform**, not only Expats.

---

## 4. Sidebar in Expats Mode

When **Expats Mode is active**, an additional section appears in the sidebar:

- **▼ Expats Mode**
  - Activation Page
  - Subscription
  - Roadmap
  - Professionals

More expats pages will be added in the future. These items appear **only when Expats Mode is active**.

---

## 5. Users Coming from the Landing

If a user registers from the Expats landing page:

- **Expats Mode is activated automatically**
- The test data is already saved
- The user enters directly into the **Activation Page**

---

## 6. Users Already Inside Syncro

User already registered on Syncro. They click the **Expats Mode** toggle.

**Case 1 — Onboarding already completed**

- User enters directly into the **Expats Activation Page**

**Case 2 — Onboarding not completed**

- User is redirected to **Expats Onboarding** (test) → **Wow Page**
- No registration (user is already logged in)
- At the end of the test:
  - Data is saved in the user's profile
  - Expats Mode is activated
  - User enters the **Activation Page**

---

## 7. When Expats Mode is NOT Active

- User does **not** see anything related to the expats module
- Expats pages do **not** appear in the sidebar
- Only standard icons (People, Places, Moments, etc.) are shown
- **Expats Mode toggle** (always at the top) activates Expats and shows expats pages

---

## Overview

| Flow | Path |
|------|------|
| **New users** | Landing → Onboarding → Wow Page → Registration → Activation Page (Expats Mode active) |
| **Existing Syncro users** | Syncro → Click Expats Mode → If onboarding done: **Activation Page**; If not: **Onboarding → Wow Page → Activation Page** |
