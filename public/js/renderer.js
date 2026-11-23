/**
 * Stepp Fitness Tetris - Canvas Renderer & Particle System
 * Draws gym equipment with custom canvas rendering.
 */

class GymRenderer {
    constructor(canvas, cols = 10, rows = 20) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = cols;
        this.rows = rows;
        this.blockSize = 30; // updated in resize
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.resize();
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Target standard Tetris 1:2 aspect ratio
        const maxWidth = Math.min(rect.width, 360);
        this.blockSize = Math.floor(maxWidth / this.cols);
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = (this.cols * this.blockSize) * dpr;
        this.canvas.height = (this.rows * this.blockSize) * dpr;

        this.canvas.style.width = `${this.cols * this.blockSize}px`;
        this.canvas.style.height = `${this.rows * this.blockSize}px`;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
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
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08; // gravity
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

        // Floating Hype Texts
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

        // Apply screen shake
        if (now < this.shakeTime) {
            const rem = (this.shakeTime - now) / 180;
            const amp = this.shakeIntensity * rem;
            const dx = (Math.random() - 0.5) * amp * 2;
            const dy = (Math.random() - 0.5) * amp * 2;
            this.ctx.translate(dx, dy);
        }

        // Draw Gym Floor Background
        this.drawBackground();

        // Draw Grid Lines (Subtle industrial carbon mesh)
        this.drawGrid();

        // Draw Locked Board Weights
        this.drawBoard(board, clearingRows);

        // Draw Ghost Piece (Drop Projection)
        if (activePiece && ghostY !== null && ghostY !== activePiece.y) {
            this.drawPiece(activePiece, activePiece.x, ghostY, true);
        }

        // Draw Active Falling Equipment Piece
        if (activePiece) {
            this.drawPiece(activePiece, activePiece.x, activePiece.y, false);
        }

        // Draw Particles & Floating PR Texts
        this.updateAndDrawParticles(now);

        this.ctx.restore();
    }

    drawBackground() {
        const w = this.cols * this.blockSize;
        const h = this.rows * this.blockSize;

        // Dark industrial gym floor
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0c0e12');
        bgGrad.addColorStop(1, '#13161c');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, w, h);

        // Subtle diagonal carbon tread pattern
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        const step = 16;
        for (let x = -h; x < w; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x + h, h);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawGrid() {
        const w = this.cols * this.blockSize;
        const h = this.rows * this.blockSize;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 1;

        for (let c = 1; c < this.cols; c++) {
            const x = c * this.blockSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
        for (let r = 1; r < this.rows; r++) {
            const y = r * this.blockSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawBoard(board, clearingRows) {
        for (let r = 0; r < this.rows; r++) {
            const isClearing = clearingRows.includes(r);
            for (let c = 0; c < this.cols; c++) {
                const cell = board[r][c];
                if (cell) {
                    if (isClearing) {
                        this.drawClearingCell(c, r, cell);
                    } else {
                        this.drawEquipmentBlock(c * this.blockSize, r * this.blockSize, this.blockSize, cell);
                    }
                }
            }
        }
    }

    drawClearingCell(c, r, cell) {
        const x = c * this.blockSize;
        const y = r * this.blockSize;
        const s = this.blockSize;

        // Flash pure incandescent white & glow
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);
        this.ctx.restore();
    }

    drawPiece(piece, gridX, gridY, isGhost = false) {
        const shape = piece.shape;
        const bs = this.blockSize;

        // Custom equipment drawing for special shapes
        if (piece.type === 'O' && !isGhost) {
            this.drawKettlebell(gridX * bs, gridY * bs, bs);
            return;
        }

        // Draw individual blocks with gym equipment characteristics
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const px = (gridX + c) * bs;
                    const py = (gridY + r) * bs;

                    if (isGhost) {
                        this.drawGhostBlock(px, py, bs, piece.color);
                    } else {
                        this.drawEquipmentSpecificBlock(px, py, bs, piece, r, c, shape);
                    }
                }
            }
        }
    }

    drawGhostBlock(x, y, s, color) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([3, 3]);
        this.ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        this.ctx.restore();
    }

    drawEquipmentBlock(x, y, s, typeId) {
        const pieceInfo = GYM_PIECES[typeId] || GYM_PIECES.I;
        this.ctx.save();

        // 3D beveled weight block with metallic gradient
        const grad = this.ctx.createLinearGradient(x, y, x + s, y + s);
        grad.addColorStop(0, pieceInfo.accentColor);
        grad.addColorStop(0.25, pieceInfo.color);
        grad.addColorStop(0.85, pieceInfo.darkColor);
        grad.addColorStop(1, '#000000');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

        // Inner metallic plate bevel
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2.5, y + 2.5, s - 5, s - 5);

        // Plate center bolt / gym logo stamp dot
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(x + s / 2, y + s / 2, s * 0.16, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(x + s / 2 - 1, y + s / 2 - 1, s * 0.07, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawEquipmentSpecificBlock(x, y, s, piece, r, c, shape) {
        const type = piece.type;
        this.ctx.save();

        // Base block draw
        this.drawEquipmentBlock(x, y, s, type);

        // Equipment-specific detail overlays:
        if (type === 'I') {
            // Olympic Barbell: knurled bar in center, bumper plates on ends
            const isEnd = (c === 0 || c === 3 || r === 0 || r === 3);
            if (isEnd) {
                // Bumper plate collar rim
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(x + s * 0.35, y + 2, s * 0.3, s - 4);
                this.ctx.strokeStyle = '#00e5ff';
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeRect(x + s * 0.35, y + 2, s * 0.3, s - 4);
            } else {
                // Knurled steel bar crosshatch
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                this.ctx.lineWidth = 1;
                for (let k = 4; k < s - 4; k += 4) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + k, y + s * 0.3);
                    this.ctx.lineTo(x + k + 2, y + s * 0.7);
                    this.ctx.stroke();
                }
            }
        } else if (type === 'T') {
            // Lat Pulldown Bar: top bar vs central cable carabiner
            if (r === 0) {
                // Pulldown top hook / carabiner
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x + s / 2, y + s / 2, s * 0.25, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                // Ergonomic rubber grip
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                this.ctx.fillRect(x + 3, y + s * 0.35, s - 6, s * 0.3);
            }
        } else if (type === 'L') {
            // Squat Rack upright holes
            this.ctx.fillStyle = '#111';
            this.ctx.beginPath();
            this.ctx.arc(x + s / 2, y + s * 0.35, 2.5, 0, Math.PI * 2);
            this.ctx.arc(x + s / 2, y + s * 0.65, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (type === 'J') {
            // Treadmill belt track ribs
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.lineWidth = 1.5;
            for (let i = 4; i < s; i += 6) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + 3, y + i);
                this.ctx.lineTo(x + s - 3, y + i);
                this.ctx.stroke();
            }
        } else if (type === 'S') {
            // Hex dumbbell head bevel
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + s * 0.25, y + 3);
            this.ctx.lineTo(x + s * 0.75, y + 3);
            this.ctx.lineTo(x + s - 3, y + s * 0.5);
            this.ctx.lineTo(x + s * 0.75, y + s - 3);
            this.ctx.lineTo(x + s * 0.25, y + s - 3);
            this.ctx.lineTo(x + 3, y + s * 0.5);
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (type === 'Z') {
            // Adjustable bench red racing stitching
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1.2;
            this.ctx.setLineDash([2, 2]);
            this.ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
        }

        this.ctx.restore();
    }

    drawKettlebell(x, y, s) {
        // Spans a 2x2 area
        const total = s * 2;
        this.ctx.save();

        // 1. Cast Iron Bell Body (Bottom circle)
        const radius = s * 0.72;
        const cx = x + s;
        const cy = y + s * 1.25;

        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, y + total - 3, radius * 0.85, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Bell body gradient
        const bellGrad = this.ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 2, cx, cy, radius);
        bellGrad.addColorStop(0, '#fff176');
        bellGrad.addColorStop(0.3, '#ffd700');
        bellGrad.addColorStop(0.8, '#a67c00');
        bellGrad.addColorStop(1, '#2c2200');

        this.ctx.fillStyle = bellGrad;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff9c4';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // 2. Cast Iron Handle Arches (Top)
        const handleGrad = this.ctx.createLinearGradient(x, y, x + total, y);
        handleGrad.addColorStop(0, '#8c7600');
        handleGrad.addColorStop(0.5, '#ffd700');
        handleGrad.addColorStop(1, '#8c7600');

        this.ctx.strokeStyle = handleGrad;
        this.ctx.lineWidth = s * 0.32;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cx - s * 0.5, cy - radius * 0.5);
        this.ctx.quadraticCurveTo(cx - s * 0.55, y + s * 0.15, cx, y + s * 0.15);
        this.ctx.quadraticCurveTo(cx + s * 0.55, y + s * 0.15, cx + s * 0.5, cy - radius * 0.5);
        this.ctx.stroke();

        // Inner handle grip knurling
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - s * 0.25, y + s * 0.15);
        this.ctx.lineTo(cx + s * 0.25, y + s * 0.15);
        this.ctx.stroke();

        // Stamped "32 KG" or Stepp "S" badge in center
        this.ctx.font = `bold ${Math.floor(s * 0.42)}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillText('32KG', cx + 1, cy + 1);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('32KG', cx, cy);

        this.ctx.restore();
    }
}

// Preview Canvas Renderer (for Next Exercise & Hold Gym Bag)
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
    }

    render(pieceId) {
        this.ctx.clearRect(0, 0, this.size, this.size);
        if (!pieceId) return;

        const pieceInfo = GYM_PIECES[pieceId];
        if (!pieceInfo) return;

        const shape = pieceInfo.shapes[0];
        const rows = shape.length;
        const cols = shape[0].length;
        const bs = 18;

        const totalW = cols * bs;
        const totalH = rows * bs;
        const offsetX = (this.size - totalW) / 2;
        const offsetY = (this.size - totalH) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) {
                    const x = offsetX + c * bs;
                    const y = offsetY + r * bs;

                    const grad = this.ctx.createLinearGradient(x, y, x + bs, y + bs);
                    grad.addColorStop(0, pieceInfo.accentColor);
                    grad.addColorStop(0.3, pieceInfo.color);
                    grad.addColorStop(1, pieceInfo.darkColor);

                    this.ctx.fillStyle = grad;
                    this.ctx.fillRect(x + 1, y + 1, bs - 2, bs - 2);

                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x + 2, y + 2, bs - 4, bs - 4);
                }
            }
        }
    }
}

window.GymRenderer = GymRenderer;
window.PreviewRenderer = PreviewRenderer;
