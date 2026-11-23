/**
 * Stepp Fitness Tetris - Game Loop & Controller
 */

class TetrisGame {
    constructor() {
        this.cols = 10;
        this.rows = 20;
        this.board = this.createBoard();

        this.canvas = document.getElementById('game-canvas');
        this.renderer = new GymRenderer(this.canvas, this.cols, this.rows);

        this.nextRenderer = new PreviewRenderer(document.getElementById('next-canvas'));
        this.holdRenderer = new PreviewRenderer(document.getElementById('hold-canvas'));

        this.randomizer = new PieceRandomizer();

        this.score = 0;       // Total LBS lifted
        this.lines = 0;       // Sets completed
        this.level = 1;       // Workout intensity
        this.highScore = parseInt(localStorage.getItem('stepp_fitness_high_pr') || '0', 10);

        this.activePiece = null;
        this.nextPieceId = null;
        this.holdPieceId = null;
        this.canHold = true;

        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = false;

        this.dropCounter = 0;
        this.dropInterval = 800; // ms
        this.lastTime = 0;

        // Lock delay mechanics
        this.lockDelay = 500;
        this.lockTimer = 0;
        this.isGrounded = false;

        this.clearingRows = [];
        this.clearAnimTimer = 0;

        this.initUI();
        this.initInput();
    }

    createBoard() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    initUI() {
        this.updateStatsUI();
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    start() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 800;
        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = true;
        this.holdPieceId = null;
        this.canHold = true;
        this.clearingRows = [];

        this.nextPieceId = this.randomizer.next();
        this.spawnPiece();

        this.updateStatsUI();
        this.holdRenderer.render(null);

        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');
        document.getElementById('start-overlay').classList.add('hidden');

        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    restart() {
        this.start();
    }

    togglePause() {
        if (!this.isRunning || this.gameOver) return;
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        if (this.isPaused) {
            pauseOverlay.classList.remove('hidden');
        } else {
            pauseOverlay.classList.add('hidden');
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    spawnPiece() {
        const type = this.nextPieceId || this.randomizer.next();
        this.nextPieceId = this.randomizer.next();
        this.nextRenderer.render(this.nextPieceId);

        const pieceDef = GYM_PIECES[type];
        const rotIndex = 0;
        const shape = pieceDef.shapes[rotIndex];

        // Center horizontally
        const x = Math.floor((this.cols - shape[0].length) / 2);
        const y = 0;

        this.activePiece = {
            type,
            name: pieceDef.name,
            subtitle: pieceDef.subtitle,
            color: pieceDef.color,
            rot: rotIndex,
            shape,
            x,
            y
        };

        this.canHold = true;
        this.isGrounded = false;
        this.lockTimer = 0;

        // Check if spawn position is blocked -> Game Over
        if (this.checkCollision(this.activePiece, x, y, shape)) {
            this.triggerGameOver();
        }

        this.updateExerciseBanner(pieceDef);
    }

    updateExerciseBanner(pieceDef) {
        const nameEl = document.getElementById('current-exercise-name');
        const descEl = document.getElementById('current-exercise-desc');
        if (nameEl && descEl && pieceDef) {
            nameEl.textContent = pieceDef.name;
            nameEl.style.color = pieceDef.color;
            descEl.textContent = pieceDef.subtitle;
        }
    }

    checkCollision(piece, px, py, shape) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const nx = px + c;
                    const ny = py + r;

                    // Out of bounds
                    if (nx < 0 || nx >= this.cols || ny >= this.rows) {
                        return true;
                    }
                    // Locked board collision (ignore negative y for spawn)
                    if (ny >= 0 && this.board[ny][nx]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getGhostY() {
        if (!this.activePiece) return null;
        let gy = this.activePiece.y;
        while (!this.checkCollision(this.activePiece, this.activePiece.x, gy + 1, this.activePiece.shape)) {
            gy++;
        }
        return gy;
    }

    move(dir) {
        if (!this.isRunning || this.isPaused || this.gameOver || !this.activePiece) return;
        const newX = this.activePiece.x + dir;
        if (!this.checkCollision(this.activePiece, newX, this.activePiece.y, this.activePiece.shape)) {
            this.activePiece.x = newX;
            if (this.isGrounded) {
                // Reset lock delay on move
                this.lockTimer = 0;
            }
            window.soundController.playMove();
        }
    }

    rotate(dir = 1) {
        if (!this.isRunning || this.isPaused || this.gameOver || !this.activePiece) return;
        const pieceDef = GYM_PIECES[this.activePiece.type];
        const numRots = pieceDef.shapes.length;
        if (numRots <= 1) return; // O-piece doesn't need rotation

        const nextRot = (this.activePiece.rot + dir + numRots) % numRots;
        const nextShape = pieceDef.shapes[nextRot];

        // Wall kick offsets to test: [0,0], [-1,0], [+1,0], [-2,0], [+2,0], [0,-1]
        const kicks = [
            [0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]
        ];

        for (const [kx, ky] of kicks) {
            const testX = this.activePiece.x + kx;
            const testY = this.activePiece.y + ky;
            if (!this.checkCollision(this.activePiece, testX, testY, nextShape)) {
                this.activePiece.rot = nextRot;
                this.activePiece.shape = nextShape;
                this.activePiece.x = testX;
                this.activePiece.y = testY;
                if (this.isGrounded) {
                    this.lockTimer = 0;
                }
                window.soundController.playRotate();
                return;
            }
        }
    }

    softDrop() {
        if (!this.isRunning || this.isPaused || this.gameOver || !this.activePiece) return;
        if (!this.checkCollision(this.activePiece, this.activePiece.x, this.activePiece.y + 1, this.activePiece.shape)) {
            this.activePiece.y++;
            this.score += 1;
            this.updateStatsUI();
            window.soundController.playDrop();
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (!this.isRunning || this.isPaused || this.gameOver || !this.activePiece) return;
        let droppedCells = 0;
        while (!this.checkCollision(this.activePiece, this.activePiece.x, this.activePiece.y + 1, this.activePiece.shape)) {
            this.activePiece.y++;
            droppedCells++;
        }
        this.score += droppedCells * 2;
        this.updateStatsUI();

        // Screen shake & heavy sound effect
        this.renderer.triggerShake(5, 150);
        window.soundController.playHardDrop();

        // Chalk dust particles at impact
        const bs = this.renderer.blockSize;
        const impactX = (this.activePiece.x + this.activePiece.shape[0].length / 2) * bs;
        const impactY = (this.activePiece.y + this.activePiece.shape.length) * bs;
        this.renderer.addChalkSparks(impactX, impactY, 14, this.activePiece.color);

        this.lockPiece();
    }

    hold() {
        if (!this.isRunning || this.isPaused || this.gameOver || !this.canHold || !this.activePiece) return;

        window.soundController.playHold();
        const currentType = this.activePiece.type;

        if (this.holdPieceId === null) {
            this.holdPieceId = currentType;
            this.spawnPiece();
        } else {
            const temp = this.holdPieceId;
            this.holdPieceId = currentType;
            this.nextPieceId = temp;
            this.spawnPiece();
        }

        this.holdRenderer.render(this.holdPieceId);
        this.canHold = false;
    }

    lockPiece() {
        if (!this.activePiece) return;
        const shape = this.activePiece.shape;
        const type = this.activePiece.type;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const by = this.activePiece.y + r;
                    const bx = this.activePiece.x + c;
                    if (by >= 0 && by < this.rows && bx >= 0 && bx < this.cols) {
                        this.board[by][bx] = type;
                    }
                }
            }
        }

        this.activePiece = null;
        this.checkLineClears();
    }

    checkLineClears() {
        const fullRows = [];
        for (let r = 0; r < this.rows; r++) {
            if (this.board[r].every(cell => cell !== 0)) {
                fullRows.push(r);
            }
        }

        if (fullRows.length > 0) {
            this.clearingRows = fullRows;
            this.clearAnimTimer = 180; // ms flash animation
            window.soundController.playClear(fullRows.length);

            // Trigger screen shake proportional to cleared rows
            this.renderer.triggerShake(fullRows.length * 3.5, 220);

            // Add celebratory gym floating text
            const bs = this.renderer.blockSize;
            const midY = (fullRows[0] * bs);
            const midX = (this.cols * bs) / 2;

            if (fullRows.length === 1) {
                this.score += 100 * this.level;
                this.renderer.addFloatingText('CLEAN REP! +100 LBS', midX, midY, '#00e5ff');
            } else if (fullRows.length === 2) {
                this.score += 300 * this.level;
                this.renderer.addFloatingText('SUPERSET! +300 LBS', midX, midY, '#ffd700');
            } else if (fullRows.length === 3) {
                this.score += 500 * this.level;
                this.renderer.addFloatingText('TRI-SET SMASH! +500 LBS', midX, midY, '#ff6d00');
            } else if (fullRows.length >= 4) {
                this.score += 1000 * this.level;
                this.renderer.addFloatingText('🔥 STEPP FITNESS PR! +1,000 LBS 🔥', midX, midY, '#ff1744', 'MAX EFFORT RECORD!');
            }

            // Spawn particle burst along cleared lines
            fullRows.forEach(r => {
                for (let c = 0; c < this.cols; c += 2) {
                    this.renderer.addChalkSparks(c * bs + bs / 2, r * bs + bs / 2, 8, '#ffffff');
                }
            });

            this.lines += fullRows.length;
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(120, 800 - (this.level - 1) * 70);
                window.soundController.playLevelUp();
                this.renderer.addFloatingText(`LEVEL UP! INTENSITY ${this.level}`, midX, midY - 30, '#00e676');
            }

            this.updateStatsUI();
        } else {
            this.spawnPiece();
        }
    }

    finishLineClears() {
        this.clearingRows.sort((a, b) => a - b);
        for (const rowIdx of this.clearingRows) {
            this.board.splice(rowIdx, 1);
            this.board.unshift(Array(this.cols).fill(0));
        }
        this.clearingRows = [];
        this.spawnPiece();
    }

    triggerGameOver() {
        this.gameOver = true;
        this.isRunning = false;
        window.soundController.playGameOver();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('stepp_fitness_high_pr', this.highScore.toString());
            document.getElementById('new-pr-badge').classList.remove('hidden');
        } else {
            document.getElementById('new-pr-badge').classList.add('hidden');
        }

        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-lines').textContent = this.lines;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('game-over-overlay').classList.remove('hidden');
        this.updateStatsUI();
    }

    updateStatsUI() {
        document.getElementById('stat-score').textContent = this.score.toLocaleString();
        document.getElementById('stat-lines').textContent = this.lines;
        document.getElementById('stat-level').textContent = this.level;
        document.getElementById('stat-high').textContent = this.highScore.toLocaleString();
    }

    gameLoop(timestamp) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Handle line clear flash delay
        if (this.clearingRows.length > 0) {
            this.clearAnimTimer -= deltaTime;
            if (this.clearAnimTimer <= 0) {
                this.finishLineClears();
            }
        } else if (this.activePiece) {
            // Normal falling gravity
            this.dropCounter += deltaTime;
            const isCollidingBelow = this.checkCollision(
                this.activePiece,
                this.activePiece.x,
                this.activePiece.y + 1,
                this.activePiece.shape
            );

            if (isCollidingBelow) {
                this.isGrounded = true;
                this.lockTimer += deltaTime;
                if (this.lockTimer >= this.lockDelay) {
                    this.lockPiece();
                }
            } else {
                this.isGrounded = false;
                this.lockTimer = 0;
                if (this.dropCounter >= this.dropInterval) {
                    this.activePiece.y++;
                    this.dropCounter = 0;
                }
            }
        }

        // Render Frame
        const ghostY = this.getGhostY();
        this.renderer.render(this.board, this.activePiece, ghostY, this.clearingRows);

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    initInput() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault(); // Prevent page scroll
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
                return;
            }

            if (e.code === 'KeyR' && (this.gameOver || !this.isRunning)) {
                this.restart();
                return;
            }

            if (!this.isRunning || this.isPaused || this.gameOver) return;

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.move(-1);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.move(1);
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'KeyX':
                    this.rotate(1); // CW
                    break;
                case 'KeyZ':
                case 'ControlLeft':
                case 'ControlRight':
                    this.rotate(-1); // CCW
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.softDrop();
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
                case 'KeyC':
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.hold();
                    break;
            }
        });

        // Touch & On-Screen Buttons
        const bindButton = (id, action) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const handler = (e) => {
                e.preventDefault();
                action();
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('click', handler);
        };

        bindButton('btn-left', () => this.move(-1));
        bindButton('btn-right', () => this.move(1));
        bindButton('btn-down', () => this.softDrop());
        bindButton('btn-slam', () => this.hardDrop());
        bindButton('btn-rotate-cw', () => this.rotate(1));
        bindButton('btn-rotate-ccw', () => this.rotate(-1));
        bindButton('btn-hold', () => this.hold());
        bindButton('btn-pause', () => this.togglePause());

        // Header and Modal Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.start());
        document.getElementById('btn-restart').addEventListener('click', () => this.restart());
        document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-pause-header').addEventListener('click', () => this.togglePause());

        // Sound Toggles
        const sfxBtn = document.getElementById('btn-toggle-sfx');
        if (sfxBtn) {
            sfxBtn.addEventListener('click', () => {
                const on = window.soundController.toggleSfx();
                sfxBtn.classList.toggle('active', on);
                sfxBtn.querySelector('.btn-label').textContent = on ? 'SFX: ON' : 'SFX: OFF';
            });
        }

        const bgmBtn = document.getElementById('btn-toggle-bgm');
        if (bgmBtn) {
            bgmBtn.addEventListener('click', () => {
                const on = window.soundController.toggleBgm();
                bgmBtn.classList.toggle('active', on);
                bgmBtn.querySelector('.btn-label').textContent = on ? 'MUSIC: ON' : 'MUSIC: OFF';
            });
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new TetrisGame();
});
