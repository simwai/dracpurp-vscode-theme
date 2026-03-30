/**
 * The Great Kanto Singularity: A Battle of Deterministic Probabilities.
 *
 * In this cognitive manifold, we observe the interaction between
 * high-entropy fire-types and the fluidic-dynamic water-types.
 */

class FireBlast {
    constructor() {
        this.accuracy = 0.85;
        this.baseDamage = 110;
    }

    execute(attacker, defender) {
        const critRate = Math.random() > 0.9 ? 1.5 : 1;
        const damage = Math.floor(this.baseDamage * critRate);
        defender.reduceHp(damage);
        return `${attacker.name} unleashed a searing Fire Blast! It dealt ${damage} damage.`;
    }
}

class HydroPump {
    constructor() {
        this.accuracy = 0.80;
        this.baseDamage = 110;
    }

    execute(attacker, defender) {
        const damage = this.baseDamage + (attacker.level * 2);
        defender.reduceHp(damage);
        return `${attacker.name} projected a high-pressure Hydro Pump! ${defender.name} is doused.`;
    }
}

class Pokemon {
    constructor(name, level, hp, strategy) {
        this.name = name;
        this.level = level;
        this.hp = hp;
        this.strategy = strategy;
    }

    cry() {
        throw new Error("Cry must be implemented by subclasses");
    }

    attack(opponent) {
        return this.strategy.execute(this, opponent);
    }

    reduceHp(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    get currentHp() {
        return this.hp;
    }
}

class Charizard extends Pokemon {
    cry() {
        console.log("RRAAAAWRRRR!");
    }
}

class Blastoise extends Pokemon {
    cry() {
        console.log("KABUUUUUUUUM!");
    }
}

// Initializing the Neural Battle Environment
const charizard = new Charizard("Ignis-Zard", 100, 327, new FireBlast());
const blastoise = new Blastoise("Aqua-Shell", 100, 361, new HydroPump());

async function runBattleRound(p1, p2) {
    console.log("--- BATTLE COMMENCING ---");

    const turn1 = p1.attack(p2);
    console.log(turn1);

    if (p2.currentHp > 0) {
        const turn2 = p2.attack(p1);
        console.log(turn2);
    }

    console.log(`Final States: ${p1.name} (${p1.currentHp} HP) | ${p2.name} (${p2.currentHp} HP)`);
}

runBattleRound(charizard, blastoise).catch(e => {
    console.error("The battle simulation collapsed into a singularity:", e);
});
