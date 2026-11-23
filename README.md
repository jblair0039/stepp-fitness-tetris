# Stepp Fitness Tetris 🏋️‍♂️

A pure HTML5 / Canvas arcade game built for **Stepp Fitness**, reimagining classic Tetris with heavy gym equipment pieces, responsive touch/keyboard controls, procedural Web Audio workout sound effects, particle bursts, and automated CI/CD deployment to Cloudflare Workers.

---

## 🏋️ Gym Equipment Roster

Instead of standard generic blocks, each piece is engineered with gym equipment characteristics and visual details:

| Piece | Equipment | Category | Description |
|---|---|---|---|
| **I** | **Olympic Barbell** | Free Weights | 45 LB chrome bar with knurled grip, collars, and Olympic bumper plates |
| **O** | **Iron Kettlebell** | Functional Strength | 32 KG solid cast iron bell with wide arched horn handle |
| **T** | **Cable Lat Pulldown** | Cable Machines | Swept multi-grip pulldown bar with high-tensile carabiner clip |
| **L** | **Power Squat Rack** | Heavy Racks | 3x3" matte-black steel upright column with red safety spotter arms |
| **J** | **Incline Treadmill** | Cardio Deck | High-impact running deck with belt tread and digital console mast |
| **S** | **Hex Dumbbells** | Free Weights | Dual heavy rubber hex dumbbell heads with contoured chrome grip |
| **Z** | **Adjustable Bench** | Strength Stations | Commercial incline bench with high-density vinyl & racing stitching |

---

## ⚡ Features

- **Pure HTML / Canvas / Web Audio**: Runs anywhere without external runtime frameworks or heavy dependencies.
- **Gym Terminology & PR Scoring**:
  - *Clean Rep* (Single line clear)
  - *Superset* (Double line clear)
  - *Tri-Set Smash* (Triple line clear)
  - *Stepp Fitness PR! Max Effort!* (Tetris 4-line quad clear)
  - High score tracking stored locally in `localStorage`.
- **Procedural Sound Engine**:
  - Web Audio API synthesizer for barbell drops, plate clanks, power chords, and boxing bells.
  - Optional toggleable high-energy workout rhythm beat.
- **Responsive & Mobile Ready**:
  - Desktop keyboard controls (`WASD` / Arrow keys / Spacebar / C / Shift).
  - Virtual touch D-Pad and action buttons for mobile & tablet screens.
- **Branded Aesthetic**:
  - Dark carbon-fiber and brushed titanium gym theme.
  - Official **Stepp Fitness** branding and logo integration.

---

## 🚀 Deployment & CI/CD

### Architecture
- **Host**: Cloudflare Workers with Static Assets.
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/deploy.yml`).
- **Trigger**: Every push or merge to the `main` branch automatically deploys to Cloudflare Workers via `cloudflare/wrangler-action@v3`.

### Local Development
```bash
npm install
npx wrangler dev
```

### Manual Deployment
```bash
npx wrangler deploy
```

---

## 🎮 Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move Left / Right | `←` / `→` or `A` / `D` | `◀` / `▶` Buttons |
| Rotate Clockwise | `↑` / `W` / `X` | `↻` Button |
| Rotate Counter-Clockwise | `Z` / `Ctrl` | `↺` Button |
| Soft Drop | `↓` / `S` | `▼` Button |
| Hard Slam (Instant Drop) | `Space` | `SLAM` Button |
| Gym Bag (Hold Piece) | `C` / `Shift` | `BAG` Button |
| Pause / Rest Interval | `P` / `Esc` | `⏸` Button |
