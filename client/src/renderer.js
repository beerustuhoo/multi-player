import { CONSTANTS } from '../../shared/constants.js';

export class Renderer {
    constructor(arenaElement) {
        this.arena = arenaElement;
        this.playerElements = new Map();
        this.powerupElements = new Map();
    }

    init() {
        this.arena.style.width = `${CONSTANTS.ARENA_WIDTH}px`;
        this.arena.style.height = `${CONSTANTS.ARENA_HEIGHT}px`;
        this.arena.style.position = 'relative';
        this.arena.style.margin = '0 auto';
        this.arena.style.border = '2px solid #666';
    }

    renderPowerups(powerups) {
        if (!powerups) return;
        const activeIds = new Set(powerups.map(p => p.id));

        // Remove despawned
        for (const [id, element] of this.powerupElements) {
            if (!activeIds.has(id)) {
                element.remove();
                this.powerupElements.delete(id);
            }
        }

        // Add/Update
        powerups.forEach(pu => {
            let el = this.powerupElements.get(pu.id);
            if (!el) {
                el = this.createPowerupElement(pu);
                this.powerupElements.set(pu.id, el);
                this.arena.appendChild(el);
            }
        });
    }

    createPowerupElement(pu) {
        const el = document.createElement('div');
        el.className = 'powerup';
        el.style.width = `${CONSTANTS.POWERUP_SIZE}px`;
        el.style.height = `${CONSTANTS.POWERUP_SIZE}px`;
        el.style.position = 'absolute';
        el.style.left = `${pu.x}px`;
        el.style.top = `${pu.y}px`;
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 0 10px white';

        // Color based on type
        if (pu.type === CONSTANTS.POWERUP_TYPES.SPEED_BOOST) {
            el.style.backgroundColor = 'yellow';
            el.innerHTML = '<div style="text-align:center; line-height:30px; font-weight:bold; color:black">S</div>';
        } else {
            el.style.backgroundColor = 'red';
            el.innerHTML = '<div style="text-align:center; line-height:30px; font-weight:bold; color:white">D</div>';
        }

        return el;
    }

    renderPlayers(players) {
        const activeIds = new Set(players.map(p => p.id));
        for (const [id, element] of this.playerElements) {
            if (!activeIds.has(id)) {
                element.remove();
                this.playerElements.delete(id);
            }
        }

        players.forEach(player => {
            let el = this.playerElements.get(player.id);

            if (!el) {
                el = this.createPlayerElement(player);
                this.playerElements.set(player.id, el);
                this.arena.appendChild(el);
            }

            this.updatePlayerTransform(el, player);
        });
    }

    createPlayerElement(player) {
        const el = document.createElement('div');
        el.classList.add('player');
        el.style.width = `${CONSTANTS.PLAYER_WIDTH}px`;
        el.style.height = `${CONSTANTS.PLAYER_HEIGHT}px`;
        el.style.position = 'absolute';
        el.style.top = '0';
        el.style.left = '0';
        el.style.willChange = 'transform';

        // Stickman Container
        const stickman = document.createElement('div');
        stickman.className = 'stickman';

        // Head
        const head = document.createElement('div');
        head.className = 'head';
        head.style.borderColor = player.color;

        // Body
        const body = document.createElement('div');
        body.className = 'body';
        body.style.backgroundColor = player.color;

        // Arms
        const armL = document.createElement('div');
        armL.className = 'limb arm arm-left';
        armL.style.backgroundColor = player.color;

        const armR = document.createElement('div');
        armR.className = 'limb arm arm-right';
        armR.style.backgroundColor = player.color;

        // Legs
        const legL = document.createElement('div');
        legL.className = 'limb leg leg-left';
        legL.style.backgroundColor = player.color;

        const legR = document.createElement('div');
        legR.className = 'limb leg leg-right';
        legR.style.backgroundColor = player.color;

        stickman.append(head, body, armL, armR, legL, legR);
        el.appendChild(stickman);

        // Name tag
        const nameTag = document.createElement('div');
        nameTag.innerText = player.name;
        nameTag.className = 'name-tag';
        el.appendChild(nameTag);

        // Health Bar
        const hpBar = document.createElement('div');
        hpBar.className = 'hp-bar';
        hpBar.style.position = 'absolute';
        hpBar.style.top = '-10px';
        hpBar.style.left = '0';
        hpBar.style.width = '100%';
        hpBar.style.height = '4px';
        hpBar.style.backgroundColor = 'red';

        const hpFill = document.createElement('div');
        hpFill.className = 'hp-fill';
        hpFill.style.width = '100%';
        hpFill.style.height = '100%';
        hpFill.style.backgroundColor = '#0f0';
        hpBar.appendChild(hpFill);
        el.appendChild(hpBar);

        return el;
    }

    updatePlayerTransform(el, player) {
        if (player.hp <= 0) {
            el.style.display = 'none';
            return;
        } else {
            el.style.display = 'block';
        }

        const x = player.x || 0;
        const y = player.y || 0;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        // HP Update
        const hpFill = el.querySelector('.hp-fill');
        let hpPercent = 0;
        if (hpFill) {
            hpPercent = Math.max(0, Math.round((player.hp / CONSTANTS.PLAYER_HP) * 100));
            hpFill.style.width = `${hpPercent}%`;
        }

        // Update Name Tag with HP
        const nameTag = el.querySelector('.name-tag');
        if (nameTag) {
            // Only update if text content is different to avoid layout thrashing
            const newText = `${player.name} (${hpPercent}%)`;
            if (nameTag.innerText !== newText) {
                nameTag.innerText = newText;
            }
        }

        // Animation Logic
        const stickman = el.querySelector('.stickman');
        if (stickman) {
            // Flip
            if (player.facing === 'left') {
                stickman.style.transform = 'scaleX(-1)';
            } else {
                stickman.style.transform = 'scaleX(1)';
            }

            // Action classes
            stickman.classList.remove('punching', 'kicking');
            if (player.action === 'punch') {
                stickman.classList.add('punching');
            } else if (player.action === 'kick') {
                stickman.classList.add('kicking');
            }

            // Visual Buffs
            // We'll use border/shadow on the stickman container wrapper or head for simplicity
            // But stickman has transform flip, so let's apply to el (main container)
            // Or better, add a glow to the stickman

            stickman.style.filter = 'none';
            if (player.buffs && player.buffs.speed > 0) {
                stickman.style.filter = 'drop-shadow(0 0 10px yellow)';
            } else if (player.buffs && player.buffs.damage > 0) {
                stickman.style.filter = 'drop-shadow(0 0 10px red)';
            }
        }
    }
}
