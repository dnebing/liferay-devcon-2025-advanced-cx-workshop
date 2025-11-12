# Liferay DevCon 2025 – Advanced Client Extensions Workshop

Welcome to the workspace for the **Liferay DevCon 2025 Advanced Client Extensions Workshop**!  
This project provides the environment and all related assets used during the hands-on session.

---

## 🧭 Workshop Purpose

This workshop explores **advanced techniques for wrapping and extending custom elements within Liferay**, focusing on how Client Extensions (CXs) and Fragments can be combined to create powerful, flexible user experiences.

By the end of the workshop, attendees will:

1. **Understand how to wrap custom elements in Liferay Fragments** to expose configuration, localization, and drop zones.  
2. **Build visually engaging components** (like animated CTAs, 3D heroes, and particle-based effects) using modern web standards.  
3. **Learn practical development workflows** for creating, deploying, and testing Client Extensions within a Liferay environment.

---

## ⚙️ Environment Setup

### Prerequisites

Make sure you have the following installed on your system:

- **Liferay Blade CLI**  
- **JDK 21**  
- **Git client**

### Setup Steps

1. **Clone this repository:**

   ```bash
   git clone https://github.com/dnebing/liferay-devcon-2025-advanced-cx-workshop.git
   cd liferay-devcon-2025-advanced-cx-workshop
   ```

2. **Initialize and build the local Liferay bundle:**

   ```bash
   blade gw initBundle
   ```

   This command prepares a local Liferay bundle using the artifacts included in the workspace.

3. **Start the environment:**

   ```bash
   blade server start
   ```

4. **Access the local site:**

   Open your browser and navigate to [http://localhost:8080](http://localhost:8080)

   **Login credentials:**
   - **Username:** `devcon-admin@liferay-devcon.com`  
   - **Password:** `learn-devcon`

---

## 💡 Workshop Components

During the session, you’ll be creating and exploring **four advanced custom element fragments**, each built with Lit and enhanced through fragment configuration:

| Fragment | Description |
|-----------|-------------|
| **Lottie CTA** | A call-to-action button enhanced with a looping or interactive Lottie animation. Great for attention-grabbing hero sections or product promotions. |
| **3D Hero** | A hero banner featuring an interactive 3D model (GLB/GLTF) with optional AR support. Demonstrates integrating external 3D assets and using fragment configuration for interactivity. |
| **Tilt Carousel** | A visually dynamic carousel with subtle 3D tilt and perspective transitions. Uses a drop zone for image fragments and fragment configuration for animation tuning. |
| **Particles Hero** | A visually rich hero section with animated particles in multiple presets (bubbles, snowy, minimal). Demonstrates fragment customization and advanced styling overrides. |

Each example highlights different ways to integrate **custom web components, fragment configuration, and dynamic content composition** within Liferay.

---

## 🧪 For Non-Attendees or Self-Guided Learning

If you’re exploring this workspace outside the live workshop — you can still follow along!

After logging into your local Liferay instance:

1. **Navigate to the “Fragment Lab” page** (available only after login).  
   This is your interactive workspace for building and testing the fragments.

2. **On the left side**, you’ll see a list of fragment names.  
   Each entry corresponds to one of the four fragments built in the workshop.

3. **Click any fragment name** to open its **details and instructions** on the right side.  
   Here you’ll find:
   - A brief description and usage steps  
   - The **HTML**, **CSS**, **JavaScript**, and **Configuration** needed for the fragment  
   - A convenient **“Copy” button** to copy each code section  

4. It’s recommended to **open two tabs**:
   - One for the **Fragment Lab** (to copy code and read instructions)  
   - One for **creating and editing the fragment** in Liferay  

By following these steps, you can complete the same exercises covered in the workshop —  
just without the **witty banter** or **personal assistance**. 😉

---

Happy building!  
**Liferay DevCon 2025 – Advanced Client Extensions Workshop Team**
