# WikiTrace Desk

WikiTrace Desk is an interactive, offline-first workspace library, cryptographic checksum auditor, and reference citation map engine. It operates entirely inside the client browser, ensuring zero data leakage to external cloud services while parsing, mapping, and exporting complex documents.

---

## 2.1 Project Title
### **WikiTrace Desk**
*Interactive Offline-First Workspace Library, Checksum Auditor, and Citation Pathfinder*

---

## 2.2 Problem Statement
In modern audit compliance and engineering workspaces, developers and compliance officers must verify and trace guidelines across massive specification sheets (spread across `.docx`, `.pdf`, `.md`, `.txt`, and `.json` formats).

Existing tools present significant drawbacks:
* **Data Privacy Risks:** Processing files via cloud APIs exposes proprietary specs, client designs, and intellectual property.
* **Manual Reference Tracing:** Figuring out how policies link together requires manual searching, leading to missed dependencies or audit gaps.
* **No Integrity Checks:** Spotting unauthorized edits or tampering requires separate tools, slowing down verification.

---

## 2.3 Objectives
1. **Local-First Privacy:** Parse, extract, and map text files entirely in memory within the client-side browser context.
2. **Universal Document Processing:** Support drag-and-drop file scanning for `.docx`, `.pdf`, `.txt`, `.md`, and `.json` files.
3. **Automated Citation Explorer:** Match text strings against database filenames using regex and draw interactive directed graphs.
4. **Local Cryptographic Auditing:** Calculate SHA-256 file hashes on the fly and log results to a session logger.
5. **Programmatic Document Compilation:** Package workspace files back into Microsoft Word `.docx` structures and launch pre-composed draft templates in Gmail.
6. **Immersive Workspace Interface:** Offer a highly interactive desk simulation landing page with customizable LED backlight controls, mechanical keyboards, and live simulated terminal indexers.

---

## 2.4 System Overview / Architecture
The architecture is 100% client-side (no database, no backend server, no cloud functions). The React application maintains a local database state inside components and utilizes dedicated modular parsing layers.

* **Navbar:** Houses brand logo, font scaling selector, full graph toggle, and theme switchers.
* **Left Sidebar:** Coordinates file uploads, list views, card toggle grids, and raw text viewers.
* **Main Content Area:** Renders document detail text, citation network mapping coordinates, and path traces.
* **Right Sidebar:** Handles cryptographic checksum generation, integrity status checks, and session logs.


## 2.5 Data Structures and Algorithms Used

### 1. Directed Graph (Citation Map)
* **Structure:** The network map is modelled as a directed graph $G = (V, E)$, where $V$ represents documents (nodes) and $E$ represents directed references (edges) indicating that document $A$ refers to document $B$.
* **Representation:** Adjacency lists mapped to React coordinate states for render nodes.

### 2. Client-Side Parsing Algorithms
* **Mammoth.js (DOCX Reader):** Extracts raw text from `.docx` files by reading their XML content:
  $$\text{File} \rightarrow \text{FileReader (ArrayBuffer)} \rightarrow \text{Mammoth.js Engine} \rightarrow \text{Plain Text}$$
* **React-PDF-to-Text (PDF Reader):** Extracts text lines from page stream coordinates:
  $$\text{File} \rightarrow \text{FileReader (Binary)} \rightarrow \text{PDFJS Render Context} \rightarrow \text{Plain Text}$$

### 3. Regex Pathfinder Algorithm
Matches references dynamically in the text:
1. Compile list of active document IDs and Titles: $\text{Keys} = \{ID_1, ID_2, ... ID_n\}$
2. For each document, scan its text body using a generated regex matching block:
   $$\text{Regex} = \bigcup_{k} \text{ID}_k$$
3. Create edges for matches. Trace the sequential path to output the connection trail.

### 4. SHA-256 Cryptographic Hashing
Uses the browser's Web Crypto API to hash file buffers:
$$\text{Hash} = \text{Crypto.subtle.digest}("SHA-256", \text{ArrayBuffer})$$

---

## 2.6 Implementation Approach
* **Vite + React:** Setup for fast hot-module replacement and rapid browser asset bundling.
* **Vanilla CSS Layouts:** Designed using responsive CSS flexbox/grid structures, custom variables for color tokens, backdrop-filters for glassmorphism panels, and grain noise SVG textures.
* **State Management:** Uses React context and component state arrays to handle loaded files, active viewing selections, integrity logs, and modal triggers.
---

## 2.7 Execution Steps
Follow these steps to run the project locally on your machine.

### Prerequisites
* Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 1. Install Dependencies
Navigate to the directory and run:
```bash
npm install
```

### 2. Run in Development Mode
Launch the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. Navigate to [http://localhost:5173/landing.html](http://localhost:5173/landing.html) to see the desk viewport.

### 3. Build for Production
To bundle and optimize the project for production deployment:
```bash
npm run build
```
The compiled, ready-to-host multi-page files (`index.html`, `landing.html`, CSS, and JS) will be output to the `dist/` directory.

---

## 2.8 Screenshots & Demo

### 🏠 Homepage / Landing Page

![WikiTrace Desk Landing Page](public/screenshots/HomePage.gif)

---

### 📖 Setup & Usage Walkthrough

**Step 1 — Profile Sign In**
> Enter your username to personalize your offline profile and stamp your developer signature across audits and exports.

![Profile Sign In](public/screenshots/login.gif)

---

**Step 2 — Tailor Typography Scale**
> Adjust character sizing system-wide on the fly to ensure complex guidelines and trace tables fit your display perfectly.

![Typography Scale](public/screenshots/fontsize.gif)

---

**Step 3 — Workspace Library**
> Drag and drop DOCX, PDF, TXT, MD, and JSON files directly into your local library — rendered client-side in card-based grid views with zero cloud upload.

![Workspace Library Upload](public/screenshots/Upload.gif)

---

**Step 4 — Connection Explorer (Citation Map)**
> Click any document to trace its structural references through an interactive citation graph. Vector paths draw in real time.

![Citation Map Explorer](public/screenshots/Citation.gif)

---

**Step 5 — Security & Integrity Audit**
> Run SHA-256 cryptographic integrity scans, flag unverified files, and log all actions in a transparent session audit panel.

![Security Audit Logger](public/screenshots/security.gif)

---

## Live Demo

🚀 **[Open Landing Page](https://wikitrace-desk.vercel.app/landing.html)**
⚡ **[Open Workspace](https://wikitrace-desk.vercel.app/)**

---

## GitHub Repository
👉 **[WIKITRACE-DESK GitHub Repository](https://github.com/paarshviv12/WIKITRACE-DESK.git)**
