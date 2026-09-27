/**
 * ============================================================================
 * Arrow Blocks - Flèche Casse-tête
 * Jeu de réflexion minimaliste en HTML5 / CSS3 / Vanilla JavaScript
 * ============================================================================
 * 
 * NOUVELLES FONCTIONNALITÉS AJOUTÉES :
 * 1. Chronomètre dégressif (base 30s + 1s par niveau + bonus cumulés).
 * 2. Système de défaite si le temps est écoulé (avec réinitialisation du bonus).
 * 3. Notation en étoiles animées / 5 à la fin du niveau selon votre rapidité.
 * 4. Bonus de vitesse de +3s satisfaisant si le niveau est terminé avant 30% du temps,
 *    qui se CUMULE d'un niveau à l'autre (+3s, +6s, +9s...) tant qu'on ne perd pas !
 */

// ============================================================================
// 1. PALETTE PASTEL & DIRECTIONS
// ============================================================================
const PASTEL_PALETTE = [
  { bg: '#FF9E9D', text: '#5C1615', name: 'coral' },     // Corail pastel
  { bg: '#80CBC4', text: '#004D40', name: 'teal' },      // Menthe douce
  { bg: '#81D4FA', text: '#01579B', name: 'azure' },     // Ciel doux
  { bg: '#CE93D8', text: '#4A148C', name: 'lavender' },  // Lavande
  { bg: '#FFD54F', text: '#E65100', name: 'butter' },    // Pêche / Miel
  { bg: '#F48FB1', text: '#880E4F', name: 'rose' },      // Rose poudré
  { bg: '#A5D6A7', text: '#1B5E20', name: 'mint' },      // Pistache
  { bg: '#9FA8DA', text: '#1A237E', name: 'periwinkle'}, // Pervenche
  { bg: '#FFAB91', text: '#BF360C', name: 'tangerine' }, // Clémentine
  { bg: '#4DB6AC', text: '#004D40', name: 'emerald' },   // Émeraude douce
  { bg: '#B39DDB', text: '#311B92', name: 'lilac' },     // Lilas
  { bg: '#FFE082', text: '#F57F17', name: 'honey' }      // Safran doux
];

const DIRECTIONS = {
  UP:    { name: 'UP',    dr: -1, dc:  0 },
  RIGHT: { name: 'RIGHT', dr:  0, dc:  1 },
  DOWN:  { name: 'DOWN',  dr:  1, dc:  0 },
  LEFT:  { name: 'LEFT',  dr:  0, dc: -1 }
};

// ============================================================================
// 2. EFFETS SONORES (Web Audio API)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Son de pop cristallin style "Block Blast" pour chaque case remplie (notes ascendantes)
  playCellPop(cellIndex = 0) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Gamme ascendante énergique et ultra-satisfaisante style Block Blast
      const popNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
      const freq = popNotes[Math.min(cellIndex, popNotes.length - 1)];

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // Pitch-bend expressif vers le haut
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  // Accord final chaleureux quand la flèche a terminé sa course
  playArrowComplete() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [880.00, 1046.50].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.29);
      });
    } catch (e) {}
  }

  playColorFlow(stepIndex) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const note = this.scale[stepIndex % this.scale.length];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playBump() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Son déplaisant / buzzer de pénalité (-2s)
  playPenalty() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Ton descendant dissonant et grinçant
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // Son cristallin lorsqu'une étoile s'allume
  playStar(index) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 523.25; // C5
      const freqs = [baseFreq, baseFreq * 1.12, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 1.88];
      const freq = freqs[Math.min(index, freqs.length - 1)];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.33);
    } catch (e) {}
  }

  // Fanfare scintillante de bonus de vitesse (Power-up)
  playSpeedBonus() {
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.31);
        }, idx * 60);
      });
    } catch (e) {}
  }

  // Son de défaite (Temps écoulé)
  playDefeat() {
    if (!this.ctx) return;
    try {
      const notes = [293.66, 277.18, 261.63, 246.94];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.36);
        }, idx * 90);
      });
    } catch (e) {}
  }

  playVictory() {
    if (!this.ctx) return;
    try {
      const chord = [392.00, 523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.56);
        }, idx * 85);
      });
    } catch (e) {}
  }
}

// ============================================================================
// 3. GÉNÉRATEUR PROCÉDURAL (Chaque flèche a une longueur >= 2 obligatoire)
// ============================================================================
class LevelGenerator {
  static getDifficulty(level) {
    if (level <= 2) {
      return { size: 3 };  // 3x3
    } else if (level <= 8) {
      return { size: 4 };  // 4x4
    } else if (level <= 20) {
      return { size: 5 };  // 5x5
    } else {
      return { size: 6 };  // 6x6
    }
  }

  static generate(levelNumber) {
    const { size } = this.getDifficulty(levelNumber);
    const dirList = [DIRECTIONS.UP, DIRECTIONS.RIGHT, DIRECTIONS.DOWN, DIRECTIONS.LEFT];

    for (let attempt = 0; attempt < 300; attempt++) {
      const grid = Array.from({ length: size }, () => Array(size).fill(null));
      let emptyCount = size * size;
      const arrows = [];

      while (emptyCount > 0) {
        const candidates = [];

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (grid[r][c] !== null) continue;

            for (const d of dirList) {
              let maxLen = 0;
              let cr = r;
              let cc = c;

              while (cr >= 0 && cr < size && cc >= 0 && cc < size && grid[cr][cc] === null) {
                maxLen++;
                cr += d.dr;
                cc += d.dc;
              }

              if (maxLen < 2) continue;

              const maxAllowed = Math.min(maxLen, size <= 4 ? 3 : 4);
              for (let l = 2; l <= maxAllowed; l++) {
                const stopR = r + l * d.dr;
                const stopC = c + l * d.dc;
                const isWall = (stopR < 0 || stopR >= size || stopC < 0 || stopC >= size);
                const isFilled = !isWall && grid[stopR][stopC] !== null;

                if (isWall || isFilled) {
                  let weight = 1;
                  if (arrows.length === 0) {
                    weight = isWall ? 4 : 1;
                  } else {
                    weight = isFilled ? 10 : 1;
                  }

                  candidates.push({
                    r, c, dir: d, len: l, isWall, stopR, stopC, weight
                  });
                }
              }
            }
          }
        }

        if (candidates.length === 0) break;

        const totalW = candidates.reduce((s, c) => s + c.weight, 0);
        let rand = Math.random() * totalW;
        let pick = candidates[0];

        for (let i = 0; i < candidates.length; i++) {
          rand -= candidates[i].weight;
          if (rand <= 0) {
            pick = candidates[i];
            break;
          }
        }

        const arrowId = arrows.length;
        const path = [];

        for (let k = 0; k < pick.len; k++) {
          const pr = pick.r + k * pick.dir.dr;
          const pc = pick.c + k * pick.dir.dc;
          grid[pr][pc] = arrowId;
          emptyCount--;
          path.push({ r: pr, c: pc });
        }

        arrows.push({
          id: arrowId,
          start: { r: pick.r, c: pick.c },
          dir: pick.dir,
          len: pick.len,
          path,
          color: PASTEL_PALETTE[arrowId % PASTEL_PALETTE.length],
          isWall: pick.isWall,
          stopBarrier: pick.isWall ? 'WALL' : { r: pick.stopR, c: pick.stopC },
          resolved: false
        });
      }

      if (emptyCount === 0 && arrows.every(a => a.len >= 2)) {
        return {
          size,
          arrows,
          levelNumber
        };
      }
    }

    return this.generateFallback(size, levelNumber);
  }

  static generateFallback(size, levelNumber) {
    const arrows = [];
    let id = 0;

    for (let r = 0; r < size; r++) {
      const path = [];
      const dir = (r % 2 === 0) ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
      const startC = (r % 2 === 0) ? 0 : size - 1;

      for (let c = 0; c < size; c++) {
        path.push({ r, c: (r % 2 === 0) ? c : (size - 1 - c) });
      }

      arrows.push({
        id: id++,
        start: { r, c: startC },
        dir,
        len: size,
        path,
        color: PASTEL_PALETTE[r % PASTEL_PALETTE.length],
        isWall: r === 0,
        stopBarrier: r === 0 ? 'WALL' : { r: r - 1, c: startC },
        resolved: false
      });
    }

    return { size, arrows, levelNumber };
  }
}

// ============================================================================
// 4. MOTEUR DU JEU (Gestion du Temps, Étoiles & Bonus)
// ============================================================================
class AmazeGame {
  constructor() {
    this.sound = new SoundEffects();
    this.currentLevel = 1;
    this.speedBonusStreak = 0;      // Nombre de bonus +3s cumulés
    this.levelData = null;
    this.cellElements = [];
    this.arrowElements = new Map();
    this.isAnimating = false;
    this.hintTimeout = null;

    // Gestion du chronomètre dégressif
    this.totalLevelTime = 30;       // Temps total alloué (secondes)
    this.timeRemaining = 30;        // Temps restant
    this.timerInterval = null;
    this.isGameOver = false;

    // Gestion du score (1 point par case coloriée dans la run)
    this.score = 0;
    this.levelStartScore = 0;
    this.bestScore = 0;

    // Éléments du DOM
    this.boardEl = document.getElementById('game-board');
    this.levelNumEl = document.getElementById('level-number');
    this.timerBadge = document.getElementById('timer-badge');
    this.timerText = document.getElementById('timer-text');
    this.activeBonusPill = document.getElementById('active-bonus-pill');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.progressText = document.getElementById('progress-text');
    this.scoreText = document.getElementById('score-text');
    this.scoreBadge = document.querySelector('.score-badge');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnNextLevel = document.getElementById('btn-next-level');
    this.btnRetryLevel = document.getElementById('btn-retry-level');
    this.victoryModal = document.getElementById('victory-modal');
    this.defeatModal = document.getElementById('defeat-modal');
    this.victoryTimeSummary = document.getElementById('victory-time-summary');
    this.victoryScoreText = document.getElementById('victory-score-text');
    this.defeatFinalScore = document.getElementById('defeat-final-score');
    this.defeatFinalLevel = document.getElementById('defeat-final-level');
    this.defeatBestScore = document.getElementById('defeat-best-score');
    this.speedBonusCard = document.getElementById('speed-bonus-card');
    this.bonusStreakBadge = document.getElementById('bonus-streak-badge');
    this.starsContainer = document.getElementById('stars-container');
    this.hintText = document.getElementById('hint-text');
    this.feedbackBadge = document.getElementById('feedback-badge');
    this.feedbackIcon = document.getElementById('feedback-icon');

    // Nouveaux éléments : Menu Principal & Modal des Règles (Tutoriel)
    this.mainMenu = document.getElementById('main-menu');
    this.btnMenuPlay = document.getElementById('btn-menu-play');
    this.btnMenuPlayText = document.getElementById('btn-menu-play-text');
    this.btnMenuNewRun = document.getElementById('btn-menu-new-run');
    this.tutorialModal = document.getElementById('tutorial-modal');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnHelp = document.getElementById('btn-help');
    this.btnHome = document.getElementById('btn-home');

    this.init();
  }

  init() {
    const savedLevel = localStorage.getItem('amaze_arrow_puzzle_level');
    if (savedLevel) {
      this.currentLevel = parseInt(savedLevel, 10) || 1;
    }

    const savedScore = localStorage.getItem('amaze_run_score');
    if (savedScore) {
      this.score = parseInt(savedScore, 10) || 0;
      this.levelStartScore = this.score;
    }

    const savedBest = localStorage.getItem('amaze_best_score');
    if (savedBest) {
      this.bestScore = parseInt(savedBest, 10) || 0;
    }

    const savedBonus = localStorage.getItem('amaze_speed_bonus_streak');
    if (savedBonus) {
      this.speedBonusStreak = parseInt(savedBonus, 10) || 0;
    }

    this.updateScoreDisplay(false);

    this.btnRestart.addEventListener('click', () => this.restartLevel());
    this.btnNextLevel.addEventListener('click', () => this.nextLevel());
    this.btnRetryLevel.addEventListener('click', () => this.retryLevelAfterDefeat());

    // Clic sur l'icône Maison (Retour au Menu en partie)
    if (this.btnHome) {
      this.btnHome.addEventListener('click', () => {
        this.stopTimer();
        if (this.btnMenuPlayText) {
          this.btnMenuPlayText.textContent = (this.levelData && !this.isGameOver) ? 'REPRENDRE' : 'JOUER';
        }
        if (this.btnMenuNewRun) {
          this.btnMenuNewRun.classList.remove('hidden');
        }
        if (this.mainMenu) {
          this.mainMenu.classList.remove('hidden');
          this.mainMenu.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // Clic sur "Nouvelle partie" depuis le Menu
    if (this.btnMenuNewRun) {
      this.btnMenuNewRun.addEventListener('click', () => {
        this.score = 0;
        this.levelStartScore = 0;
        this.currentLevel = 1;
        this.speedBonusStreak = 0;
        localStorage.setItem('amaze_run_score', '0');
        localStorage.setItem('amaze_arrow_puzzle_level', '1');
        localStorage.setItem('amaze_speed_bonus_streak', '0');
        this.activeBonusPill.classList.add('hidden');
        this.updateScoreDisplay(false);

        if (this.mainMenu) {
          this.mainMenu.classList.add('hidden');
          this.mainMenu.setAttribute('aria-hidden', 'true');
        }
        this.sound.init();
        this.loadLevel(1);
      });
    }

    // 0. Clic sur le bouton "?" de l'en-tête -> Rouvre les règles à tout moment
    if (this.btnHelp) {
      this.btnHelp.addEventListener('click', () => {
        if (this.tutorialModal) {
          this.tutorialModal.classList.remove('hidden');
          this.tutorialModal.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // 1. Clic sur "JOUER / REPRENDRE" du Menu Principal
    if (this.btnMenuPlay) {
      this.btnMenuPlay.addEventListener('click', () => {
        this.sound.init();
        if (this.mainMenu) {
          this.mainMenu.classList.add('hidden');
          this.mainMenu.setAttribute('aria-hidden', 'true');
        }

        // Si partie en cours, reprendre simplement le chrono
        if (this.levelData && !this.isGameOver) {
          this.startTimer();
          return;
        }

        // Sinon, lancer les règles/tutoriel initial
        if (this.tutorialModal) {
          this.tutorialModal.classList.remove('hidden');
          this.tutorialModal.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // 2. Clic sur "JOUER !" du Modal des Règles -> Lance la partie
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        if (this.tutorialModal) {
          this.tutorialModal.classList.add('hidden');
          this.tutorialModal.setAttribute('aria-hidden', 'true');
        }
        this.sound.init();
        if (!this.levelData) {
          this.loadLevel(this.currentLevel || 1);
        }
      });
    }

    const unlockAudio = () => {
      this.sound.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
  }

  // Animation Block Blast : Bulle flottante "+1" sur chaque case
  createPointPopup(cell, color) {
    const popup = document.createElement('span');
    popup.className = 'point-popup';
    popup.textContent = '+1';
    popup.style.color = color;
    cell.appendChild(popup);
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 680);
  }

  // Animation Block Blast : Éclats de particules pétillantes
  createSparkleBurst(cell, color) {
    const container = document.createElement('div');
    container.className = 'sparkle-container';
    for (let i = 0; i < 4; i++) {
      const sp = document.createElement('span');
      sp.className = `cell-sparkle sparkle-${i}`;
      sp.style.backgroundColor = color;
      container.appendChild(sp);
    }
    cell.appendChild(container);
    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 460);
  }

  updateScoreDisplay(animated = true) {
    if (this.scoreText) {
      this.scoreText.textContent = this.score;
    }
    if (animated && this.scoreBadge) {
      this.scoreBadge.classList.remove('score-pop');
      void this.scoreBadge.offsetWidth;
      this.scoreBadge.classList.add('score-pop');
    }
  }

  loadLevel(levelNum) {
    this.currentLevel = levelNum;
    this.levelNumEl.textContent = levelNum;
    this.levelStartScore = this.score;
    this.updateScoreDisplay(false);
    this.levelData = LevelGenerator.generate(levelNum);
    this.isAnimating = false;
    this.isGameOver = false;

    // Fermeture des modaux
    if (this.tutorialModal) {
      this.tutorialModal.classList.add('hidden');
      this.tutorialModal.setAttribute('aria-hidden', 'true');
    }
    this.victoryModal.classList.add('hidden');
    this.victoryModal.setAttribute('aria-hidden', 'true');
    this.defeatModal.classList.add('hidden');
    this.defeatModal.setAttribute('aria-hidden', 'true');

    // Calcul du temps alloué : Base 30s + 1s par niveau + Bonus de vitesse cumulé (+3s par streak)
    const baseTime = 30 + (this.currentLevel - 1) * 1;
    const bonusTime = this.speedBonusStreak * 3;
    this.totalLevelTime = baseTime + bonusTime;
    this.timeRemaining = this.totalLevelTime;

    // Affichage de la pilule de bonus dans l'en-tête si actif
    if (this.speedBonusStreak > 0) {
      this.activeBonusPill.textContent = `⚡ +${bonusTime}s`;
      this.activeBonusPill.classList.remove('hidden');
    } else {
      this.activeBonusPill.classList.add('hidden');
    }

    this.startTimer();
    this.updateProgress();
    this.showFeedback('👉', 'Touchez une flèche pour propulser sa couleur', false);
    this.renderBoard();
  }

  // =========================================================================
  // GESTION DU CHRONOMÈTRE
  // =========================================================================
  startTimer() {
    this.stopTimer();
    this.updateTimerDisplay();

    const intervalMs = 100; // Mise à jour fréquente pour fluidité
    this.timerInterval = setInterval(() => {
      if (this.isGameOver) return;

      this.timeRemaining = Math.max(0, this.timeRemaining - intervalMs / 1000);
      this.updateTimerDisplay();

      // Condition de Défaite : Temps Écoulé !
      if (this.timeRemaining <= 0) {
        this.handleTimeOut();
      }
    }, intervalMs);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const seconds = Math.ceil(this.timeRemaining);
    this.timerText.textContent = `${seconds}s`;

    // Clignotement d'urgence si <= 5 secondes
    if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
      this.timerBadge.classList.add('low-time');
    } else {
      this.timerBadge.classList.remove('low-time');
    }
  }

  // Application d'une pénalité de -2s lors d'une erreur (flèche bloquée)
  applyTimePenalty() {
    if (this.isGameOver) return;

    // Déduction immédiate de 2 secondes
    this.timeRemaining = Math.max(0, this.timeRemaining - 2);
    this.updateTimerDisplay();

    // Effet visuel désagréable / secousse sur le badge du chronomètre
    if (this.timerBadge) {
      this.timerBadge.classList.remove('penalty-shake');
      void this.timerBadge.offsetWidth; // Force reflow
      this.timerBadge.classList.add('penalty-shake');
      setTimeout(() => this.timerBadge.classList.remove('penalty-shake'), 480);

      // Bulle d'alerte "-2s" rouge tombante
      const penaltyPopup = document.createElement('span');
      penaltyPopup.className = 'time-penalty-popup';
      penaltyPopup.textContent = '-2s';
      this.timerBadge.appendChild(penaltyPopup);

      setTimeout(() => {
        if (penaltyPopup.parentNode) {
          penaltyPopup.parentNode.removeChild(penaltyPopup);
        }
      }, 750);
    }

    // Son de buzzer désagréable
    this.sound.playPenalty();

    // Vibration haptique abrasive
    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }

    // Si la pénalité fait tomber le chrono à zéro -> Défaite immédiate
    if (this.timeRemaining <= 0) {
      this.handleTimeOut();
    }
  }

  // En cas de défaite par temps écoulé : Fin de la run, réinitialisation à zéro
  handleTimeOut() {
    this.stopTimer();
    this.isGameOver = true;
    this.sound.playDefeat();

    // Enregistrement du record de score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('amaze_best_score', this.bestScore.toString());
    }

    // Affichage des scores dans le modal de défaite
    if (this.defeatFinalScore) this.defeatFinalScore.textContent = this.score;
    if (this.defeatFinalLevel) this.defeatFinalLevel.textContent = this.currentLevel;
    if (this.defeatBestScore) this.defeatBestScore.textContent = `🏆 Meilleur score : ${this.bestScore} pts`;

    // Réinitialisation de la run à zéro (score = 0, niveau = 1, bonus = 0)
    this.score = 0;
    this.levelStartScore = 0;
    this.currentLevel = 1;
    this.speedBonusStreak = 0;
    localStorage.setItem('amaze_run_score', '0');
    localStorage.setItem('amaze_arrow_puzzle_level', '1');
    localStorage.setItem('amaze_speed_bonus_streak', '0');
    this.activeBonusPill.classList.add('hidden');
    this.updateScoreDisplay(false);

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      this.defeatModal.classList.remove('hidden');
      this.defeatModal.setAttribute('aria-hidden', 'false');
    }, 200);
  }

  retryLevelAfterDefeat() {
    this.defeatModal.classList.add('hidden');
    this.defeatModal.setAttribute('aria-hidden', 'true');
    this.score = 0;
    this.levelStartScore = 0;
    this.currentLevel = 1;
    this.loadLevel(1);
  }

  updateProgress() {
    const { size } = this.levelData;
    const totalCells = size * size;
    let filledCells = 0;

    for (const a of this.levelData.arrows) {
      if (a.resolved) {
        filledCells += a.path.length;
      }
    }

    const percent = Math.round((filledCells / totalCells) * 100);
    this.progressBarFill.style.width = `${percent}%`;
    this.progressText.textContent = `${filledCells} / ${totalCells} cases (${percent}%)`;
  }

  renderBoard() {
    const { size, arrows } = this.levelData;
    this.boardEl.innerHTML = '';
    this.boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    this.cellElements = Array.from({ length: size }, () => Array(size).fill(null));
    this.arrowElements.clear();

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        this.boardEl.appendChild(cell);
        this.cellElements[r][c] = cell;
      }
    }

    arrows.forEach(arrow => {
      const { r, c } = arrow.start;
      const targetCell = this.cellElements[r][c];

      const arrowBlock = document.createElement('div');
      arrowBlock.className = `arrow-block dir-${arrow.dir.name}`;
      arrowBlock.style.backgroundColor = arrow.color.bg;
      arrowBlock.style.color = arrow.color.text;
      arrowBlock.dataset.arrowId = arrow.id;

      arrowBlock.innerHTML = `
        <svg class="arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <polyline points="5 11 12 4 19 11"></polyline>
        </svg>
      `;

      this.bindArrowEvents(arrowBlock, arrow);

      targetCell.appendChild(arrowBlock);
      this.arrowElements.set(arrow.id, arrowBlock);
    });
  }

  bindArrowEvents(element, arrow) {
    let startX = 0;
    let startY = 0;

    element.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startY = e.clientY;
    });

    element.addEventListener('pointerup', (e) => {
      if (this.isAnimating || arrow.resolved || this.isGameOver) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dist < 40) {
        this.handleArrowTap(arrow);
      } else {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        let swipeDir = '';
        if (angle >= -45 && angle <= 45) swipeDir = 'RIGHT';
        else if (angle > 45 && angle <= 135) swipeDir = 'DOWN';
        else if (angle < -45 && angle >= -135) swipeDir = 'UP';
        else swipeDir = 'LEFT';

        if (swipeDir === arrow.dir.name || dist < 60) {
          this.handleArrowTap(arrow);
        }
      }
    });
  }

  findBlocker(arrow) {
    if (arrow.stopBarrier === 'WALL') {
      return null;
    }

    const { r, c } = arrow.stopBarrier;
    const targetCell = this.cellElements[r][c];

    if (targetCell && targetCell.classList.contains('filled')) {
      return null;
    }

    const blockingArrow = this.levelData.arrows.find(a => !a.resolved && a.path.some(p => p.r === r && p.c === c));
    return blockingArrow || null;
  }

  handleArrowTap(arrow) {
    if (arrow.resolved || this.isAnimating || this.isGameOver) return;
    this.sound.init();

    const arrowEl = this.arrowElements.get(arrow.id);
    const blocker = this.findBlocker(arrow);

    if (blocker) {
      if (arrowEl) {
        const bumpClass = `bump-${arrow.dir.name}`;
        arrowEl.classList.remove('bump-UP', 'bump-RIGHT', 'bump-DOWN', 'bump-LEFT');
        void arrowEl.offsetWidth;
        arrowEl.classList.add(bumpClass);

        const blockerEl = this.arrowElements.get(blocker.id);
        if (blockerEl) {
          blockerEl.classList.remove('highlight-blocker');
          void blockerEl.offsetWidth;
          blockerEl.classList.add('highlight-blocker');
          setTimeout(() => blockerEl.classList.remove('highlight-blocker'), 1200);
        }

        // Pénalité déplaisante de -2s sur le chronomètre avec secousse et buzzer
        this.applyTimePenalty();

        this.showFeedback('⛔', 'Bloquée ! Pénalité de -2s.', true);
      }
      return;
    }

    this.executeColorFlow(arrow, arrowEl);
  }

  executeColorFlow(arrow, arrowEl) {
    this.isAnimating = true;
    arrow.resolved = true;

    arrowEl.classList.add('resolved');

    this.showFeedback('✨', 'Couleur propulsée !', false);

    const stepDelay = 65;
    const totalCells = arrow.path.length;

    arrow.path.forEach((pos, index) => {
      setTimeout(() => {
        const cell = this.cellElements[pos.r][pos.c];
        if (cell) {
          cell.style.backgroundColor = arrow.color.bg;
          cell.classList.remove('filled-anim');
          void cell.offsetWidth; // Force reflow pour déclencher le pop
          cell.classList.add('filled', 'filled-anim');

          // Animation 1 : Bulle flottante "+1" style Block Blast
          this.createPointPopup(cell, arrow.color.text || '#FFFFFF');

          // Animation 2 : Éclat de particules étincelantes
          this.createSparkleBurst(cell, arrow.color.bg);
        }

        // Son 1 : Pop cristallin marimba ascendant
        this.sound.playCellPop(index);

        // Haptique tactile dynamique
        if (navigator.vibrate) {
          navigator.vibrate(12);
        }

        // Chaque case coloriée rapporte 1 point
        this.score++;
        this.updateScoreDisplay(true);

        this.updateProgress();

        if (index === totalCells - 1) {
          this.sound.playArrowComplete();
          this.isAnimating = false;
          this.checkWinCondition();
        }
      }, index * stepDelay);
    });
  }

  showFeedback(icon, text, isBlocked) {
    this.feedbackIcon.textContent = icon;
    this.hintText.textContent = text;

    if (isBlocked) {
      this.feedbackBadge.classList.add('blocked');
    } else {
      this.feedbackBadge.classList.remove('blocked');
    }

    clearTimeout(this.hintTimeout);
    this.hintTimeout = setTimeout(() => {
      this.feedbackIcon.textContent = '👉';
      this.hintText.textContent = 'Touchez une flèche pour propulser sa couleur';
      this.feedbackBadge.classList.remove('blocked');
    }, 1800);
  }

  // =========================================================================
  // CONDITION DE VICTOIRE, CALCUL DES ÉTOILES /5 & BONUS DE VITESSE
  // =========================================================================
  checkWinCondition() {
    const allResolved = this.levelData.arrows.every(a => a.resolved);
    if (allResolved && !this.isGameOver) {
      this.stopTimer();

      const timeUsed = this.totalLevelTime - this.timeRemaining;
      const timeRatioUsed = timeUsed / this.totalLevelTime;

      // 1. Calcul des étoiles / 5 selon la rapidité :
      // - Avant 30% du temps : 5 étoiles ⭐⭐⭐⭐⭐
      // - Avant 50% du temps : 4 étoiles ⭐⭐⭐⭐
      // - Avant 70% du temps : 3 étoiles ⭐⭐⭐
      // - Avant 85% du temps : 2 étoiles ⭐⭐
      // - Fin de temps : 1 étoile ⭐
      let starCount = 1;
      if (timeRatioUsed <= 0.30) starCount = 5;
      else if (timeRatioUsed <= 0.50) starCount = 4;
      else if (timeRatioUsed <= 0.70) starCount = 3;
      else if (timeRatioUsed <= 0.85) starCount = 2;

      // 2. Bonus de Vitesse (+3s cumulé) : UNIQUEMENT si 5 étoiles (avant 30% du temps)
      // Si réussite SANS 5 étoiles : la série de bonus de secondes est supprimée (remise à 0) !
      const gotSpeedBonus = (starCount === 5);
      if (gotSpeedBonus) {
        this.speedBonusStreak++;
        localStorage.setItem('amaze_speed_bonus_streak', this.speedBonusStreak.toString());
      } else {
        this.speedBonusStreak = 0;
        localStorage.setItem('amaze_speed_bonus_streak', '0');
      }

      // Sauvegarde du score et du niveau atteint dans la run
      const nextLevelNum = this.currentLevel + 1;
      localStorage.setItem('amaze_arrow_puzzle_level', nextLevelNum.toString());
      localStorage.setItem('amaze_run_score', this.score.toString());

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('amaze_best_score', this.bestScore.toString());
      }

      this.sound.playVictory();

      if (navigator.vibrate) {
        navigator.vibrate([40, 80, 40]);
      }

      // Préparation de l'affichage du modal de victoire
      this.victoryTimeSummary.textContent = `Temps : ${timeUsed.toFixed(1)}s / ${this.totalLevelTime}s`;
      if (this.victoryScoreText) {
        this.victoryScoreText.textContent = `${this.score} pts`;
      }

      // Affichage ou non de la carte de bonus festif
      if (gotSpeedBonus) {
        const totalBonus = this.speedBonusStreak * 3;
        this.bonusStreakBadge.textContent = `⚡ Bonus cumulé : +${totalBonus}s`;
        this.speedBonusCard.classList.remove('hidden');
        setTimeout(() => this.sound.playSpeedBonus(), 450);
      } else {
        this.speedBonusCard.classList.add('hidden');
      }

      // Animation séquentielle d'apparition des étoiles avec tintement
      const starSlots = this.starsContainer.querySelectorAll('.star-slot');
      starSlots.forEach((slot, idx) => {
        slot.classList.remove('active');
        if (idx < starCount) {
          setTimeout(() => {
            slot.classList.add('active');
            this.sound.playStar(idx);
          }, 350 + idx * 140);
        }
      });

      setTimeout(() => {
        this.victoryModal.classList.remove('hidden');
        this.victoryModal.setAttribute('aria-hidden', 'false');
      }, 300);
    }
  }

  restartLevel() {
    if (this.isAnimating) return;
    this.sound.init();

    // Rétablir le score au score de départ de ce niveau (ne pas dupliquer de points)
    this.score = this.levelStartScore;
    this.updateScoreDisplay(false);

    this.levelData.arrows.forEach(a => {
      a.resolved = false;
    });

    const { size } = this.levelData;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = this.cellElements[r][c];
        if (cell) {
          cell.style.backgroundColor = '';
          cell.classList.remove('filled', 'filled-anim');
        }
      }
    }

    this.arrowElements.forEach(el => {
      el.classList.remove('resolved', 'bump-UP', 'bump-RIGHT', 'bump-DOWN', 'bump-LEFT', 'highlight-blocker');
    });

    // Réinitialisation du temps pour ce niveau
    const baseTime = 30 + (this.currentLevel - 1) * 1;
    const bonusTime = this.speedBonusStreak * 3;
    this.totalLevelTime = baseTime + bonusTime;
    this.timeRemaining = this.totalLevelTime;
    this.startTimer();

    this.updateProgress();
    this.showFeedback('↺', 'Niveau réinitialisé', false);
    this.isAnimating = false;
  }

  nextLevel() {
    this.sound.init();
    this.loadLevel(this.currentLevel + 1);
  }
}

// ============================================================================
// 5. INITIALISATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  new AmazeGame();
});
