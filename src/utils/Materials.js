export const MATERIALS = {
    WOOD: {
        name: 'wood',
        hardness: 10,
        damageReduction: 0.2, // 20% reduction
        opacity: 1.0, // Blocks vision
        color: 0x8b4513
    },
    CONCRETE: {
        name: 'concrete',
        hardness: 80,
        damageReduction: 0.8,
        opacity: 1.0,
        color: 0x888888
    },
    METAL: {
        name: 'metal',
        hardness: 100,
        damageReduction: 0.9,
        opacity: 1.0,
        color: 0x444444
    },
    GLASS: {
        name: 'glass',
        hardness: 5,
        damageReduction: 0.05,
        opacity: 0.1, // Almost transparent
        color: 0xaaddff
    },
    FOLIAGE: {
        name: 'foliage',
        hardness: 0,
        damageReduction: 0,
        opacity: 0.5, // Semi-transparent
        color: 0x228b22
    }
};
