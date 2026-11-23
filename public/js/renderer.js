/**
 * Stepp Fitness Tetris - Solid Modular Gym Equipment Renderer
 * 100% Readable Grid with Heavy Gym Equipment Plates & "Almost Complete" Row Radar
 */

class GymRenderer {
    constructor(canvas, cols = 10, rows = 20) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = cols;
        this.rows = rows;
        this.blockSize = 30;
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // Equipment Assets for Preview & UI
        this.previewImages = {};
        this.loadPreviewAssets();

        this.resize();
    }

    loadPreviewAssets() {
        const assetMap = {
            'I': 'assets/pieces/barbell_h.svg',
            'O': 'assets/pieces/kettlebell.svg',
            'T': 'assets/pieces/lat_bar.svg',
            'L': 'assets/pieces/squat_rack.svg',
            'J': 'assets/pieces/treadmill.svg',
            'S': 'assets/pieces/dumbbells.svg',
            'Z': 'assets/pieces/bench.svg'
        };

        for (const [key, src] of Object.entries(assetMap)) {
            const img = new Image();
            img.src = src;
            this.previewImages[key] = img;
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const maxWidth = Math.min(rect.width, 360);
        this.blockSize = Math.floor(maxWidth / this.cols);
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = (this.cols * this.blockSize) * dpr;
        this.canvas.height = (this.rows * this.blockSize) * dpr;

        this.canvas.style.width = `${this.cols * this.blockSize}px`;
        this.canvas.style.height = `${this.rows * this.blockSize}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }

    triggerShake(intensity = 6, duration = 180) {
        this.shakeIntensity = intensity;
        this.shakeTime = performance.now() + duration;
    }

    addChalkSparks(x, y, count = 12, color = '#ff9800') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 3.5,
                color: Math.random() > 0.4 ? color : '#ffffff',
                isChalk: Math.random() > 0.6
            });
        }
    }

    addFloatingText(text, x, y, color = '#00e5ff', subtext = '') {
        this.floatingTexts.push({
            text,
            subtext,
            x,
            y,
            vy: -1.2,
            life: 1.0,
            decay: 0.015,
            color
        });
    }

    updateAndDrawParticles(now) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            if (p.isChalk) {
                this.ctx.fillStyle = '#f0f4f8';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 6;
                this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            this.ctx.restore();
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= ft.decay;

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = Math.min(1.0, ft.life * 1.5);
            this.ctx.font = 'bold 15px "Impact", "Arial Black", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowColor = ft.color;
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(ft.text, ft.x, ft.y);

            if (ft.subtext) {
                this.ctx.font = '11px sans-serif';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(ft.subtext, ft.x, ft.y + 16);
            }
            this.ctx.restore();
        }
    }

    render(board, activePiece, ghostY, clearingRows = []) {
        const now = performance.now();
        this.ctx.save();

        if (now < this.shakeTime) {
            const rem = (this.shakeTime - now) / 180;
            const amp = this.shakeIntensity * rem;
            const dx = (Math.random() - 0.5) * amp * 2;
            const dy = (Math.random() - 0.5) * amp * 2;
            this.ctx.translate(dx, dy);
        }

        // 1. Gym floor background
        this.drawBackground();

        // 2. Grid lines & Row Completion Radar
        this.drawGridAndRowRadar(board, now);

        // 3. Locked board equipment blocks
        this.drawBoard(board, clearingRows);

        // 4. High-contrast precision ghost target
        if (activePiece && ghostY !== null && ghostY !== activePiece.y) {
            this.drawGhostPiece(activePiece, activePiece.x, ghostY);
        }

        // 5. Active falling gym equipment piece
        if (activePiece) {
            this.drawActivePiece(activePiece, activePiece.x, activePiece.y);
        }

        this.updateAndDrawParticles(now);
        this.ctx.restore();
    }

    drawBackground() {
        const w = this.cols * this.blockSize;
        const h = this.rows * this.blockSize;

        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#090b0e');
        bgGrad.addColorStop(1, '#11141b');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, w, h);

        // Carbon weave texture
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        const step = 14;
        for (let x = -h; x < w; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + h, h);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawGridAndRowRadar(board, now) {
        const w = this.cols * this.blockSize;
        const h = this.rows * this.blockSize;
        const bs = this.blockSize;

        this.ctx.save();

        // Check for almost-complete rows (8 or 9 out of 10 cells filled)
        for (let r = 0; r < this.rows; r++) {
            let filledCount = 0;
            for (let c = 0; c < this.cols; c++) {
                if (board[r][c] !== 0) filledCount++;
            }

            if (filledCount >= 8 && filledCount < 10) {
                // Energetic pulsing glow on the almost-complete set
                const pulse = 0.5 + 0.5 * Math.sin(now * 0.009);
                this.ctx.fillStyle = `rgba(0, 229, 255, ${0.08 + pulse * 0.12})`;
                this.ctx.fillRect(0, r * bs, w, bs);

                this.ctx.strokeStyle = `rgba(0, 229, 255, ${0.4 + pulse * 0.5})`;
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeRect(1, r * bs + 1, w - 2, bs - 2);

                // Side chevron markers
                this.ctx.fillStyle = '#00e5ff';
                this.ctx.beginPath();
                this.ctx.moveTo(2, r * bs + 4);
                this.ctx.lineTo(8, r * bs + bs / 2);
                this.ctx.lineTo(2, r * bs + bs - 4);
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.moveTo(w - 2, r * bs + 4);
                this.ctx.lineTo(w - 8, r * bs + bs / 2);
                this.ctx.lineTo(w - 2, r * bs + bs - 4);
                this.ctx.fill();
            }
        }

        // Standard high-readability grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;

        for (let c = 1; c < this.cols; c++) {
            const x = c * bs;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let r = 1; r < this.rows; r++) {
            const y = r * bs;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawBoard(board, clearingRows) {
        const bs = this.blockSize;
        for (let r = 0; r < this.rows; r++) {
            const isClearing = clearingRows.includes(r);
            for (let c = 0; c < this.cols; c++) {
                const cell = board[r][c];
                if (cell) {
                    const typeId = typeof cell === 'string' ? cell : (cell.type || 'I');
                    if (isClearing) {
                        this.drawClearingCell(c * bs, r * bs, bs);
                    } else {
                        this.drawModularEquipmentCell(c * bs, r * bs, bs, typeId);
                    }
                }
            }
        }
    }

    drawActivePiece(piece, gridX, gridY) {
        const shape = piece.shape;
        const bs = this.blockSize;
        const type = piece.type;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const px = (gridX + c) * bs;
                    const py = (gridY + r) * bs;
                    this.drawModularEquipmentCell(px, py, bs, type, true);
                }
            }
        }
    }

    drawGhostPiece(piece, gridX, gridY) {
        const shape = piece.shape;
        const bs = this.blockSize;
        const pieceInfo = GYM_PIECES[piece.type] || GYM_PIECES.I;

        this.ctx.save();
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const px = (gridX + c) * bs;
                    const py = (gridY + r) * bs;

                    // High-contrast target cell: semi-transparent plate with glowing neon dashed border
                    this.ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
                    this.ctx.fillRect(px + 1, py + 1, bs - 2, bs - 2);

                    this.ctx.strokeStyle = pieceInfo.color;
                    this.ctx.lineWidth = 1.5;
                    this.ctx.setLineDash([4, 3]);
                    this.ctx.strokeRect(px + 1.5, py + 1.5, bs - 3, bs - 3);

                    // Target crosshair indicator in center
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(px + bs / 2 - 3, py + bs / 2);
                    this.ctx.lineTo(px + bs / 2 + 3, py + bs / 2);
                    this.ctx.moveTo(px + bs / 2, py + bs / 2 - 3);
                    this.ctx.lineTo(px + bs / 2, py + bs / 2 + 3);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.restore();
    }

    /**
     * Solid Modular Gym Equipment Cell
     * Draws a solid, tactile 1x1 block representing authentic gym equipment.
     */
    drawModularEquipmentCell(x, y, s, typeId, isActive = false) {
        this.ctx.save();

        const p = 1.5; // padding for crisp cell boundary
        const bx = x + p;
        const by = y + p;
        const bs = s - p * 2;

        if (typeId === 'I') {
            // === OLYMPIC BARBELL BUMPER PLATE ===
            // Dark rubber plate body
            const plateGrad = this.ctx.createRadialGradient(bx + bs / 2, by + bs / 2, 2, bx + bs / 2, by + bs / 2, bs * 0.7);
            plateGrad.addColorStop(0, '#263238');
            plateGrad.addColorStop(0.7, '#141a20');
            plateGrad.addColorStop(1, '#0a0d10');

            this.ctx.fillStyle = plateGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            // Cyan Olympic Steel Rim Bevel
            this.ctx.strokeStyle = '#00e5ff';
            this.ctx.lineWidth = 1.8;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Knurled Steel Bar Shaft running through center
            this.ctx.fillStyle = '#cfd8dc';
            this.ctx.fillRect(bx, by + bs * 0.38, bs, bs * 0.24);

            // Knurling hatching
            this.ctx.strokeStyle = '#37474f';
            this.ctx.lineWidth = 1;
            for (let i = bx + 2; i < bx + bs - 2; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, by + bs * 0.38);
                this.ctx.lineTo(i + 2, by + bs * 0.62);
                this.ctx.stroke();
            }

            // Center Olympic Collar Hub
            this.ctx.fillStyle = '#00e5ff';
            this.ctx.beginPath();
            this.ctx.arc(bx + bs / 2, by + bs / 2, bs * 0.16, 0, Math.PI * 2);
            this.ctx.fill();

        } else if (typeId === 'O') {
            // === CAST IRON KETTLEBELL TILE ===
            // Solid textured cast iron with gold/bronze metallic trim
            const ironGrad = this.ctx.createRadialGradient(bx + bs * 0.35, by + bs * 0.35, 2, bx + bs / 2, by + bs / 2, bs * 0.7);
            ironGrad.addColorStop(0, '#fff59d');
            ironGrad.addColorStop(0.25, '#ffd700');
            ironGrad.addColorStop(0.7, '#8c7300');
            ironGrad.addColorStop(1, '#2c2400');

            this.ctx.fillStyle = ironGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            // Gold metallic beveled rim
            this.ctx.strokeStyle = '#fff9c4';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Kettlebell handle horn arch motif
            this.ctx.fillStyle = '#1f1900';
            this.ctx.beginPath();
            this.ctx.arc(bx + bs / 2, by + bs / 2, bs * 0.28, 0, Math.PI * 2);
            this.ctx.fill();

            // Stamped "32"
            this.ctx.font = `bold ${Math.floor(bs * 0.32)}px sans-serif`;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('32', bx + bs / 2, by + bs / 2);

        } else if (typeId === 'T') {
            // === CABLE LAT / WEIGHT STACK PLATE ===
            // Industrial purple steel weight-stack plate
            const stackGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            stackGrad.addColorStop(0, '#f48fb1');
            stackGrad.addColorStop(0.25, '#d500f9');
            stackGrad.addColorStop(0.8, '#6a0080');
            stackGrad.addColorStop(1, '#1b0020');

            this.ctx.fillStyle = stackGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            this.ctx.strokeStyle = '#ea80fc';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Dual vertical chrome guide rods
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(bx + bs * 0.22, by, bs * 0.1, bs);
            this.ctx.fillRect(bx + bs * 0.68, by, bs * 0.1, bs);

            // Center selector pin hole
            this.ctx.fillStyle = '#0a000d';
            this.ctx.beginPath();
            this.ctx.arc(bx + bs / 2, by + bs / 2, bs * 0.18, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 1.2;
            this.ctx.stroke();

        } else if (typeId === 'L') {
            // === POWER SQUAT RACK BOX-TUBE ===
            // Matte black heavy 3x3 steel column
            const rackGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            rackGrad.addColorStop(0, '#455a64');
            rackGrad.addColorStop(0.3, '#212121');
            rackGrad.addColorStop(0.8, '#121212');
            rackGrad.addColorStop(1, '#080808');

            this.ctx.fillStyle = rackGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            // Safety orange industrial border
            this.ctx.strokeStyle = '#ff6d00';
            this.ctx.lineWidth = 1.8;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Laser-cut pin holes
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(bx + bs / 2, by + bs * 0.35, bs * 0.12, 0, Math.PI * 2);
            this.ctx.arc(bx + bs / 2, by + bs * 0.65, bs * 0.12, 0, Math.PI * 2);
            this.ctx.fill();

            // Hole chrome rim
            this.ctx.strokeStyle = '#90a4ae';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

        } else if (typeId === 'J') {
            // === INCLINE TREADMILL RUNNING DECK ===
            // Heavy diamond-tread rubber running belt
            const tmGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            tmGrad.addColorStop(0, '#1c222c');
            tmGrad.addColorStop(0.5, '#0e1218');
            tmGrad.addColorStop(1, '#18202a');

            this.ctx.fillStyle = tmGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            // Electric blue frame border
            this.ctx.strokeStyle = '#2979ff';
            this.ctx.lineWidth = 1.8;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Non-slip yellow hazard safety stripe along top/bottom
            this.ctx.fillStyle = '#ffd600';
            this.ctx.fillRect(bx + 2, by + 2, bs - 4, 3);
            this.ctx.fillRect(bx + 2, by + bs - 5, bs - 4, 3);

            // Tread rubber ribs
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1.2;
            for (let i = by + 8; i < by + bs - 8; i += 4) {
                this.ctx.beginPath();
                this.ctx.moveTo(bx + 4, i);
                this.ctx.lineTo(bx + bs - 4, i);
                this.ctx.stroke();
            }

        } else if (typeId === 'S') {
            // === RUBBER HEX DUMBBELL TILE ===
            // Toxic green rubber hex weight block
            const dbGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            dbGrad.addColorStop(0, '#b9f6ca');
            dbGrad.addColorStop(0.25, '#00e676');
            dbGrad.addColorStop(0.7, '#008744');
            dbGrad.addColorStop(1, '#062814');

            this.ctx.fillStyle = dbGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Hexagon facet motif
            this.ctx.fillStyle = '#0a1a0f';
            this.ctx.beginPath();
            const cx = bx + bs / 2;
            const cy = by + bs / 2;
            const r = bs * 0.34;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = cx + r * Math.cos(angle);
                const hy = cy + r * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(hx, hy);
                else this.ctx.lineTo(hx, hy);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.strokeStyle = '#00e676';
            this.ctx.lineWidth = 1.2;
            this.ctx.stroke();

            // Stamped "50"
            this.ctx.font = `bold ${Math.floor(bs * 0.28)}px sans-serif`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('50', cx, cy);

        } else if (typeId === 'Z') {
            // === INCLINE WORKOUT BENCH CUSHION ===
            // Carbon-fiber textured vinyl cushion with red racing seams
            const benchGrad = this.ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            benchGrad.addColorStop(0, '#ff8a80');
            benchGrad.addColorStop(0.25, '#ff1744');
            benchGrad.addColorStop(0.7, '#a10022');
            benchGrad.addColorStop(1, '#2c0008');

            this.ctx.fillStyle = benchGrad;
            this.ctx.fillRect(bx, by, bs, bs);

            // Racing red perimeter border
            this.ctx.strokeStyle = '#ff1744';
            this.ctx.lineWidth = 1.8;
            this.ctx.strokeRect(bx + 1, by + 1, bs - 2, bs - 2);

            // Double red racing stitching (dashed white/red line)
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.2;
            this.ctx.setLineDash([2, 2]);
            this.ctx.strokeRect(bx + 3, by + 3, bs - 6, bs - 6);
            this.ctx.setLineDash([]);

            // Center Stepp "S" cushion deboss
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(bx + bs / 2, by + bs / 2, bs * 0.18, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Active piece glow highlight
        if (isActive) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(bx, by, bs, bs);
        }

        this.ctx.restore();
    }

    drawClearingCell(x, y, s) {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 18;
        this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
        this.ctx.restore();
    }
}

// Preview Renderer using Full Illustrated Equipment
class PreviewRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 90;
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.size * this.dpr;
        this.canvas.height = this.size * this.dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.ctx.scale(this.dpr, this.dpr);

        this.images = {};
        const map = {
            'I': 'assets/pieces/barbell_h.svg',
            'O': 'assets/pieces/kettlebell.svg',
            'T': 'assets/pieces/lat_bar.svg',
            'L': 'assets/pieces/squat_rack.svg',
            'J': 'assets/pieces/treadmill.svg',
            'S': 'assets/pieces/dumbbells.svg',
            'Z': 'assets/pieces/bench.svg'
        };
        for (const [k, src] of Object.entries(map)) {
            const img = new Image();
            img.src = src;
            this.images[k] = img;
        }
    }

    render(pieceId) {
        this.ctx.clearRect(0, 0, this.size, this.size);
        if (!pieceId) return;

        const img = this.images[pieceId];
        if (!img || !img.complete) {
            if (img) {
                img.onload = () => this.render(pieceId);
            }
            return;
        }

        const s = this.size;
        this.ctx.save();
        if (pieceId === 'I') {
            const w = s * 0.9;
            const h = w / 4;
            this.ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        } else if (pieceId === 'O') {
            const dim = s * 0.8;
            this.ctx.drawImage(img, (s - dim) / 2, (s - dim) / 2, dim, dim);
        } else {
            const dim = s * 0.85;
            this.ctx.drawImage(img, (s - dim) / 2, (s - dim) / 2, dim, dim);
        }
        this.ctx.restore();
    }
}

window.GymRenderer = GymRenderer;
window.PreviewRenderer = PreviewRenderer;
