/**
 * Logged into the Aincrad Cognitive Manifold.
 * Initializing Dual Blades Sword Skill...
 */
package swordart.online;

import java.util.Optional;

public abstract class Player {
    private final String name;
    protected int level;
    private int hp;

    public Player(String name, int level, int hp) {
        this.name = name;
        this.level = level;
        this.hp = hp;
    }

    public abstract void useSwordSkill(String skillName);

    public void takeDamage(int amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.hp == 0) {
            System.out.println(name + " shattered into polygons.");
        }
    }

    public String getName() { return name; }
}

class Kirito extends Player {
    private boolean dualWieldingActive = false;

    public Kirito() {
        super("Kirito", 96, 18500);
    }

    @Override
    public void useSwordSkill(String skillName) {
        if (dualWieldingActive && "Starburst Stream".equals(skillName)) {
            System.out.println("Executing 16-hit combo: " + skillName);
        } else {
            System.out.println("Using basic skill: " + skillName);
        }
    }

    public void toggleDualWielding() {
        this.dualWieldingActive = !this.dualWieldingActive;
    }
}
