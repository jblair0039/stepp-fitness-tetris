/**
 * Stepp Fitness Tetris - Canvas Renderer with Real Gym Equipment Images
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

        // Preload Gym Equipment SVG Images
        this.images = {};
        this.loadAssets();

        this.resize();
    }

    loadAssets() {
        const assetMap = {
            'I_h': 'assets/pieces/barbell_h.svg',
            'I_v': 'assets/pieces/barbell_v.svg',
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
            this.images[key] = img;
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

    render(board, activePiece, ghostY, clearingRows = [], lockedPieces = []) {
        const now = performance.now();
        this.ctx.save();

        if (now < this.shakeTime) {
            const rem = (this.shakeTime - now) / 180;
            const amp = this.shakeIntensity * rem;
            const dx = (Math.random() - 0.5) * amp * 2;
            const dy = (Math.random() - 0.5) * amp * 2;
            this.ctx.translate(dx, dy);
        }

        this.drawBackground();
        this.drawGrid();

        // Draw Locked Equipment Pieces using real equipment images clipped to active cells
        this.drawLockedBoard(board, lockedPieces, clearingRows);

        // Draw Ghost Piece (Drop Projection of real gym equipment)
        if (activePiece && ghostY !== null && ghostY !== activePiece.y) {
            this.drawEquipmentImage(activePiece, activePiece.x, ghostY, true);
        }

        // Draw Active Falling Equipment Piece
        if (activePiece) {
            this.drawEquipmentImage(activePiece, activePiece.x, activePiece.y, false);
        }

        this.updateAndDrawParticles(now);
        this.ctx.restore();
    }

    drawBackground() {
        const w = this.cols * this.blockSize;
        const h = this.rows * this.blockSize;

        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a0c10');
        bgGrad.addColorStop(1, '#12151c');
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, w, h);

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
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

    drawLockedBoard(board, lockedPieces = [], clearingRows = []) {
        const bs = this.blockSize;
        const drawnCells = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

        // 1. Draw each locked piece using its gym equipment image clipped to surviving cells
        for (const lp of lockedPieces) {
            const survivingCells = [];
            for (let r = 0; r < lp.shape.length; r++) {
                for (let c = 0; c < lp.shape[r].length; c++) {
                    if (lp.shape[r][c]) {
                        const by = lp.y + r;
                        const bx = lp.x + c;
                        if (by >= 0 && by < this.rows && bx >= 0 && bx < this.cols && board[by][bx] !== 0) {
                            survivingCells.push({ bx, by });
                            drawnCells[by][bx] = true;
                        }
                    }
                }
            }

            if (survivingCells.length > 0) {
                this.ctx.save();
                this.ctx.beginPath();
                for (const cell of survivingCells) {
                    this.ctx.rect(cell.bx * bs, cell.by * bs, bs, bs);
                }
                this.ctx.clip();
                this.drawEquipmentImage(lp, lp.x, lp.y, false);
                this.ctx.restore();
            }
        }

        // 2. Draw any remaining cells as sleek beveled equipment plates
        for (let r = 0; r < this.rows; r++) {
            const isClearing = clearingRows.includes(r);
            for (let c = 0; c < this.cols; c++) {
                const cell = board[r][c];
                if (cell && !drawnCells[r][c]) {
                    const typeId = typeof cell === 'string' ? cell : (cell.type || 'I');
                    if (isClearing) {
                        this.drawClearingCell(c, r);
                    } else {
                        this.drawFallbackEquipmentBlock(c * bs, r * bs, bs, typeId);
                    }
                } else if (cell && isClearing) {
                    this.drawClearingCell(c, r);
                }
            }
        }
    }

    drawClearingCell(c, r) {
        const x = c * this.blockSize;
        const y = r * this.blockSize;
        const s = this.blockSize;

        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.shadowBlur = 16;
        this.ctx.fillRect(x, y, s, s);
        this.ctx.restore();
    }

    drawEquipmentImage(piece, gridX, gridY, isGhost = false) {
        const bs = this.blockSize;
        const type = piece.type;
        const rot = piece.rot || 0;

        this.ctx.save();

        if (isGhost) {
            this.ctx.globalAlpha = 0.32;
            this.ctx.filter = 'drop-shadow(0 0 8px #00e5ff)';
        }

        if (type === 'I') {
            const actualRows = piece.shape.length;
            const actualCols = piece.shape[0].length;

            if (actualCols === 4 && actualRows === 4) {
                let rowIdx = 1;
                for (let r = 0; r < 4; r++) {
                    if (piece.shape[r].includes(1)) {
                        if (piece.shape[r].filter(v => v === 1).length >= 3) {
                            rowIdx = r;
                            break;
                        }
                    }
                }
                const isH = piece.shape[rowIdx].filter(v => v === 1).length >= 4;
                if (isH) {
                    const img = this.images['I_h'];
                    if (img && img.complete) {
                        this.ctx.drawImage(img, gridX * bs, (gridY + rowIdx) * bs, 4 * bs, 1 * bs);
                    }
                } else {
                    let colIdx = 1;
                    for (let c = 0; c < 4; c++) {
                        if (piece.shape.map(r => r[c]).filter(v => v === 1).length >= 4) {
                            colIdx = c;
                            break;
                        }
                    }
                    const img = this.images['I_v'];
                    if (img && img.complete) {
                        this.ctx.drawImage(img, (gridX + colIdx) * bs, gridY * bs, 1 * bs, 4 * bs);
                    }
                }
            } else if (actualCols === 4) {
                const img = this.images['I_h'];
                if (img && img.complete) {
                    this.ctx.drawImage(img, gridX * bs, gridY * bs, 4 * bs, bs);
                }
            } else {
                const img = this.images['I_v'];
                if (img && img.complete) {
                    this.ctx.drawImage(img, gridX * bs, gridY * bs, bs, 4 * bs);
                }
            }
        } else if (type === 'O') {
            const img = this.images['O'];
            if (img && img.complete) {
                this.ctx.drawImage(img, gridX * bs, gridY * bs, 2 * bs, 2 * bs);
            }
        } else {
            const imgKey = type;
            const img = this.images[imgKey];
            if (img && img.complete) {
                const size = 3 * bs;
                const cx = (gridX + 1.5) * bs;
                const cy = (gridY + 1.5) * bs;

                this.ctx.translate(cx, cy);
                this.ctx.rotate(rot * (Math.PI / 2));
                this.ctx.drawImage(img, -size / 2, -size / 2, size, size);
            }
        }

        this.ctx.restore();
    }

    drawFallbackEquipmentBlock(x, y, s, typeId) {
        const pieceInfo = GYM_PIECES[typeId] || GYM_PIECES.I;
        this.ctx.save();

        const grad = this.ctx.createLinearGradient(x, y, x + s, y + s);
        grad.addColorStop(0, pieceInfo.accentColor);
        grad.addColorStop(0.3, pieceInfo.color);
        grad.addColorStop(1, pieceInfo.darkColor);

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(x + s / 2, y + s / 2, s * 0.18, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }
}

// Preview Renderer using Real Gym Equipment Images
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
