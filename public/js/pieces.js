/**
 * Stepp Fitness Tetris - Gym Equipment Definitions & SRS Rotations
 */

const GYM_PIECES = {
    I: {
        id: 'I',
        name: 'Olympic Barbell',
        category: 'Heavy Free Weights',
        subtitle: '45 LB Chrome Bar with Bumper Plates',
        color: '#00e5ff',
        darkColor: '#007a87',
        accentColor: '#e0f7fa',
        glowColor: 'rgba(0, 229, 255, 0.6)',
        shapes: [
            [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0],
                [0, 0, 1, 0]
            ],
            [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0]
            ],
            [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0]
            ]
        ]
    },
    O: {
        id: 'O',
        name: 'Iron Kettlebell',
        category: 'Functional Strength',
        subtitle: '32 KG Cast Iron Bell & Wide Horn Handle',
        color: '#ffd700',
        darkColor: '#8c7600',
        accentColor: '#fff9c4',
        glowColor: 'rgba(255, 215, 0, 0.6)',
        shapes: [
            [
                [1, 1],
                [1, 1]
            ]
        ]
    },
    T: {
        id: 'T',
        name: 'Cable Lat Bar',
        category: 'Cable Machines',
        subtitle: 'Multi-Grip Lat Pulldown & Carabiner',
        color: '#d500f9',
        darkColor: '#7b0091',
        accentColor: '#f3e5f5',
        glowColor: 'rgba(213, 0, 249, 0.6)',
        shapes: [
            [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ]
    },
    L: {
        id: 'L',
        name: 'Power Squat Rack',
        category: 'Heavy Racks',
        subtitle: '3x3 Heavy Steel Upright & Red Spotter Arms',
        color: '#ff6d00',
        darkColor: '#9e3f00',
        accentColor: '#ffe0b2',
        glowColor: 'rgba(255, 109, 0, 0.6)',
        shapes: [
            [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [1, 0, 0]
            ],
            [
                [1, 1, 0],
                [0, 1, 0],
                [0, 1, 0]
            ]
        ]
    },
    J: {
        id: 'J',
        name: 'Incline Treadmill',
        category: 'Cardio Deck',
        subtitle: 'High-Impact Running Deck & Console Mast',
        color: '#2979ff',
        darkColor: '#1248ab',
        accentColor: '#bbdefb',
        glowColor: 'rgba(41, 121, 255, 0.6)',
        shapes: [
            [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 1, 1],
                [0, 1, 0],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 1, 0],
                [0, 1, 0],
                [1, 1, 0]
            ]
        ]
    },
    S: {
        id: 'S',
        name: 'Hex Dumbbells',
        category: 'Dumbbell Arsenal',
        subtitle: 'Rubber Hex Heads & Knurled Contoured Grip',
        color: '#00e676',
        darkColor: '#008744',
        accentColor: '#b9f6ca',
        glowColor: 'rgba(0, 230, 118, 0.6)',
        shapes: [
            [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            [
                [0, 1, 0],
                [0, 1, 1],
                [0, 0, 1]
            ],
            [
                [0, 0, 0],
                [0, 1, 1],
                [1, 1, 0]
            ],
            [
                [1, 0, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]
        ]
    },
    Z: {
        id: 'Z',
        name: 'Adjustable Bench',
        category: 'Strength Stations',
        subtitle: 'Commercial Incline Bench with Red Stitching',
        color: '#ff1744',
        darkColor: '#a10022',
        accentColor: '#ffcdd2',
        glowColor: 'rgba(255, 23, 68, 0.6)',
        shapes: [
            [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            [
                [0, 0, 1],
                [0, 1, 1],
                [0, 1, 0]
            ],
            [
                [0, 0, 0],
                [1, 1, 0],
                [0, 1, 1]
            ],
            [
                [0, 1, 0],
                [1, 1, 0],
                [1, 0, 0]
            ]
        ]
    }
};

// Standard 7-bag randomizer for balanced distribution
class PieceRandomizer {
    constructor() {
        this.bag = [];
    }

    next() {
        if (this.bag.length === 0) {
            this.bag = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
            // Fisher-Yates shuffle
            for (let i = this.bag.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
            }
        }
        return this.bag.pop();
    }
}

window.GYM_PIECES = GYM_PIECES;
window.PieceRandomizer = PieceRandomizer;
