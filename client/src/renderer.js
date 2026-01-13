import { CONSTANTS } from '../../shared/constants.js';

export class Renderer {
    constructor(arenaElement) {
        this.arena = arenaElement;
        this.playerElements = new Map();
        this.powerupElements = new Map();
        // Reusable Sets to avoid allocation every frame
        this.activePlayerIds = new Set();
        this.activePowerupIds = new Set();
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
        
        // Reuse Set instead of creating new one
        this.activePowerupIds.clear();
        for (let i = 0; i < powerups.length; i++) {
            this.activePowerupIds.add(powerups[i].id);
        }

        // Remove despawned
        for (const [id, element] of this.powerupElements) {
            if (!this.activePowerupIds.has(id)) {
                element.remove();
                this.powerupElements.delete(id);
            }
        }

        // Add/Update
        for (let i = 0; i < powerups.length; i++) {
            const pu = powerups[i];
            let el = this.powerupElements.get(pu.id);
            if (!el) {
                el = this.createPowerupElement(pu);
                this.powerupElements.set(pu.id, el);
                this.arena.appendChild(el);
            }
        }
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
        el.style.contain = 'layout style paint'; // Optimization: hints to browser

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
        // Reuse Set instead of creating new one
        this.activePlayerIds.clear();
        for (let i = 0; i < players.length; i++) {
            this.activePlayerIds.add(players[i].id);
        }
        
        for (const [id, element] of this.playerElements) {
            if (!this.activePlayerIds.has(id)) {
                element.remove();
                this.playerElements.delete(id);
            }
        }

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            let el = this.playerElements.get(player.id);

            if (!el) {
                el = this.createPlayerElement(player);
                this.playerElements.set(player.id, el);
                this.arena.appendChild(el);
            }

            this.updatePlayerTransform(el, player);
        }
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
        // Optimization: contain layout/paint to reduce reflow impact
        el.style.contain = 'layout style paint';

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
        nameTag.textContent = player.name;
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

        // Cache references and last state
        el._refs = {
            stickman,
            nameTag,
            hpFill,
        };
        el._state = {
            x: null,
            y: null,
            hp: null,
            facing: null,
            action: null,
            buffs: null,
            visible: true, // Track visibility state
            transformStr: null // Cache transform string
        };

        return el;
    }

    updatePlayerTransform(el, player) {
        const { stickman, nameTag, hpFill } = el._refs;
        const lastState = el._state;

        // Visibility check - only update when state changes
        const isVisible = player.hp > 0;
        const wasVisible = lastState.visible !== false; // null/undefined means visible
        if (isVisible !== wasVisible) {
            el.style.display = isVisible ? 'block' : 'none';
            lastState.visible = isVisible;
            if (!isVisible) return; // Early return if hidden
        } else if (!isVisible) {
            return; // Already hidden, skip updates
        }

        // Position - cache transform string to avoid template literal overhead
        const x = player.x || 0;
        const y = player.y || 0;
        if (x !== lastState.x || y !== lastState.y) {
            // Create transform string (template literal is fast, but we avoid style recalculation by caching)
            lastState.transformStr = `translate3d(${x}px,${y}px,0)`;
            el.style.transform = lastState.transformStr;
            lastState.x = x;
            lastState.y = y;
        }

        // HP Update
        // Update HP bar only if changed
        if (player.hp !== lastState.hp) {
            const hpPercent = Math.max(0, Math.round((player.hp / CONSTANTS.PLAYER_HP) * 100));
            const hpWidth = `${hpPercent}%`;
            if (hpFill.style.width !== hpWidth) {
                hpFill.style.width = hpWidth;
            }

            // Update Name Tag + HP text - cache to avoid string concatenation
            const newText = `${player.name} (${hpPercent}%)`;
            if (nameTag.textContent !== newText) {
                nameTag.textContent = newText;
            }
            lastState.hp = player.hp;
        }

        // Orientation - only update transform when facing changes
        if (player.facing !== lastState.facing) {
            const newTransform = player.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
            // Only update if transform actually changed (handles case where position transform might be combined)
            if (stickman.style.transform !== newTransform) {
                stickman.style.transform = newTransform;
            }
            lastState.facing = player.facing;
        }

        // Action classes
        if (player.action !== lastState.action) {
            stickman.classList.remove('punching', 'kicking');
            if (player.action === 'punch') {
                stickman.classList.add('punching');
            } else if (player.action === 'kick') {
                stickman.classList.add('kicking');
            }
            lastState.action = player.action;
        }

        // Visual Buffs - Filter is expensive, only update if buffs changed
        const speedBuff = player.buffs?.speed || 0;
        const damageBuff = player.buffs?.damage || 0;
        // Simple hash or comparison for buffs
        const buffsChanged = !lastState.buffs ||
            lastState.buffs.speed !== speedBuff ||
            lastState.buffs.damage !== damageBuff;

        if (buffsChanged) {
            if (speedBuff > 0) {
                stickman.style.filter = 'drop-shadow(0 0 10px yellow)';
            } else if (damageBuff > 0) {
                stickman.style.filter = 'drop-shadow(0 0 10px red)';
            } else {
                stickman.style.filter = 'none';
            }
            lastState.buffs = { speed: speedBuff, damage: damageBuff };
        }
    }
}
