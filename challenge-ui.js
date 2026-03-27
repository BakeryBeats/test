/**
 * Challenge UI Handler
 * Manages all the UI interactions for the Baking Challenge system
 */

class ChallengeUI {
  constructor(bakingChallenge) {
    this.challenge = bakingChallenge;
    this.currentChallengeId = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.populateChallengeMenu();
  }

  bindEvents() {
    const challengeBtn = document.getElementById('challengeBtn');
    if (challengeBtn) {
      challengeBtn.addEventListener('click', () => this.showChallengeMenu());
    }

    document.getElementById('closeChallenge')?.addEventListener('click', () => {
      document.getElementById('challengeModal').classList.remove('active');
    });

    document.getElementById('closeChallengeResult')?.addEventListener('click', () => {
      document.getElementById('challengeResult').classList.remove('active');
    });

    document.getElementById('closeChallengeMenu')?.addEventListener('click', () => {
      document.getElementById('challengeMenu').classList.remove('active');
    });

    document.getElementById('startChallengeBtn')?.addEventListener('click', () => {
      this.startSelectedChallenge();
    });

    document.getElementById('retryBtn')?.addEventListener('click', () => {
      this.retryChallenge();
    });

    document.getElementById('nextChallengeBtn')?.addEventListener('click', () => {
      this.nextChallenge();
    });

    document.getElementById('backMenuBtn')?.addEventListener('click', () => {
      document.getElementById('challengeResult').classList.remove('active');
      this.showChallengeMenu();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.populateChallengeMenu(e.target.dataset.difficulty);
      });
    });

    document.getElementById('challengeModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'challengeModal') {
        e.target.classList.remove('active');
      }
    });

    document.getElementById('challengeResult')?.addEventListener('click', (e) => {
      if (e.target.id === 'challengeResult') {
        e.target.classList.remove('active');
      }
    });

    document.getElementById('challengeMenu')?.addEventListener('click', (e) => {
      if (e.target.id === 'challengeMenu') {
        e.target.classList.remove('active');
      }
    });
  }

  showChallengeMenu() {
    const menu = document.getElementById('challengeMenu');
    if (menu) {
      menu.classList.add('active');
      this.populateChallengeMenu('Easy');
    }
  }

  populateChallengeMenu(difficulty = 'Easy') {
    const grid = document.getElementById('challengesGrid');
    if (!grid) return;

    const challenges = this.challenge.getChallengesByDifficulty(difficulty);
    
    grid.innerHTML = challenges.map(ch => `
      <div class="challenge-card" data-challenge-id="${ch.id}">
        <div class="challenge-difficulty-badge ${ch.difficulty}">${ch.difficulty}</div>
        <h4>${ch.title}</h4>
        <p>${ch.description}</p>
        <small>⏱ ${ch.timeLimit}s</small>
      </div>
    `).join('');

    grid.querySelectorAll('.challenge-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectChallenge(parseInt(card.dataset.challengeId));
      });
    });
  }

  selectChallenge(challengeId) {
    this.currentChallengeId = challengeId;
    document.getElementById('challengeMenu').classList.remove('active');
    this.challenge.startChallenge(challengeId);
  }

  startSelectedChallenge() {
    document.getElementById('challengeModal').classList.remove('active');
  }

  retryChallenge() {
    document.getElementById('challengeResult').classList.remove('active');
    this.challenge.startChallenge(this.currentChallengeId);
  }

  nextChallenge() {
    const difficulty = this.challenge.currentChallenge.difficulty;
    const nextChallenge = this.challenge.getRandomChallenge(difficulty);
    this.selectChallenge(nextChallenge.id);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.bakingChallenge) {
    window.challengeUI = new ChallengeUI(window.bakingChallenge);
  }
});