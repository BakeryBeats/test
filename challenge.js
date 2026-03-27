/**
 * Baking Challenge - Mini-game for BakeryBeats
 * Create drum patterns based on challenge instructions
 */

class BakingChallenge {
  constructor(drumMachine) {
    this.drumMachine = drumMachine;
    this.currentChallenge = null;
    this.isActive = false;
    this.score = 0;
    this.challenges = [
      // Easy Challenges
      {
        id: 1,
        difficulty: 'Easy',
        title: '🥐 Croissant Rhythm',
        description: 'Create a simple kick pattern: activate steps 0, 4, 8, 12',
        drums: ['kick'],
        targetSteps: { kick: [0, 4, 8, 12] },
        hints: ['Focus on every 4th step', 'Start with kick on beat 1'],
        timeLimit: 30
      },
      {
        id: 2,
        difficulty: 'Easy',
        title: '🍞 Bread Basics',
        description: 'Basic snare pattern: steps 4, 12',
        drums: ['snare'],
        targetSteps: { snare: [4, 12] },
        hints: ['Snare comes on the off-beat', 'Count: 1-2-3-SNARE-5-6-7-SNARE'],
        timeLimit: 30
      },
      {
        id: 3,
        difficulty: 'Easy',
        title: '🥧 Perfect Pie',
        description: 'Hi-Hat pattern: activate every other step (0, 2, 4, 6, 8, 10, 12, 14)',
        drums: ['hihat'],
        targetSteps: { hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
        hints: ['Steady eighths', 'Like a clock ticking'],
        timeLimit: 30
      },
      // Medium Challenges
      {
        id: 4,
        difficulty: 'Medium',
        title: '🎂 Cake Complexity',
        description: 'Combine kick and snare: kick at 0,8 + snare at 4,12',
        drums: ['kick', 'snare'],
        targetSteps: { kick: [0, 8], snare: [4, 12] },
        hints: ['Kick and snare work together', 'Kick on 1 and 3, Snare on 2 and 4'],
        timeLimit: 45
      },
      {
        id: 5,
        difficulty: 'Medium',
        title: '🍰 Sophisticated Sweets',
        description: 'Create a groove: kick at 0,2,8,10 + hi-hat at 0,2,4,6,8,10,12,14',
        drums: ['kick', 'hihat'],
        targetSteps: { kick: [0, 2, 8, 10], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
        hints: ['Kick pattern is syncopated', 'Hi-hat stays steady'],
        timeLimit: 45
      },
      {
        id: 6,
        difficulty: 'Medium',
        title: '🧁 Cupcake Craft',
        description: 'Snare roll: snare at 4,6,8,10,12,14',
        drums: ['snare'],
        targetSteps: { snare: [4, 6, 8, 10, 12, 14] },
        hints: ['Quick snare hits', 'Build momentum!'],
        timeLimit: 40
      },
      // Hard Challenges
      {
        id: 7,
        difficulty: 'Hard',
        title: '👨‍🍳 Master Baker',
        description: 'Complex polyrhythm: kick at 0,4,8,12 + snare at 2,6,10,14 + hihat at 0,2,4,6,8,10,12,14',
        drums: ['kick', 'snare', 'hihat'],
        targetSteps: { kick: [0, 4, 8, 12], snare: [2, 6, 10, 14], hihat: [0, 2, 4, 6, 8, 10, 12, 14] },
        hints: ['Work on one drum at a time', 'Start with kick, then snare, then hihat', 'Hip-hop classic pattern!'],
        timeLimit: 60
      },
      {
        id: 8,
        difficulty: 'Hard',
        title: '🎵 Syncopation Station',
        description: 'Tricky rhythm: kick at 0,3,7,10,14 + snare at 4,12 + clap at 6',
        drums: ['kick', 'snare', 'clap'],
        targetSteps: { kick: [0, 3, 7, 10, 14], snare: [4, 12], clap: [6] },
        hints: ['Listen carefully to the pattern', 'Off-beat kick hits', 'Clap adds spice!'],
        timeLimit: 60
      }
    ];
    this.leaderboard = this.loadLeaderboard();
  }

  startChallenge(challengeId) {
    this.currentChallenge = this.challenges.find(c => c.id === challengeId);
    if (!this.currentChallenge) return false;

    this.isActive = true;
    this.score = 0;
    
    this.drumMachine.clearPattern();
    this.showChallengeUI();
    
    if (this.currentChallenge.timeLimit) {
      this.startTimer();
    }

    return true;
  }

  showChallengeUI() {
    const modal = document.getElementById('challengeModal');
    if (!modal) return;

    document.getElementById('challengeTitle').textContent = this.currentChallenge.title;
    document.getElementById('challengeDesc').textContent = this.currentChallenge.description;
    document.getElementById('challengeDifficulty').textContent = this.currentChallenge.difficulty;
    document.getElementById('challengeHints').innerHTML = 
      this.currentChallenge.hints.map(h => `<li>${h}</li>`).join('');
    
    modal.classList.add('active');
  }

  hideChallengeUI() {
    const modal = document.getElementById('challengeModal');
    if (modal) modal.classList.remove('active');
  }

  startTimer() {
    let timeLeft = this.currentChallenge.timeLimit;
    const timerEl = document.getElementById('challengeTimer');
    
    const timerInterval = setInterval(() => {
      timeLeft--;
      if (timerEl) {
        timerEl.textContent = timeLeft;
        timerEl.style.color = timeLeft < 10 ? '#ff6b6b' : '#ffd93d';
      }

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        this.checkChallenge(false);
      }
    }, 1000);
  }

  checkChallenge(userSubmitted = true) {
    if (!this.currentChallenge) return;

    let correctDrums = 0;
    let totalSteps = 0;
    let feedback = [];

    this.currentChallenge.drums.forEach(drum => {
      const targetSteps = this.currentChallenge.targetSteps[drum];
      const userSteps = [];
      
      for (let i = 0; i < this.drumMachine.numSteps; i++) {
        if (this.drumMachine.patterns[drum][i]) {
          userSteps.push(i);
        }
      }

      const correctCount = targetSteps.filter(s => userSteps.includes(s)).length;
      const wrongCount = userSteps.filter(s => !targetSteps.includes(s)).length;
      
      correctDrums += correctCount;
      totalSteps += targetSteps.length;

      const accuracy = totalSteps > 0 ? Math.round((correctCount / targetSteps.length) * 100) : 0;
      feedback.push({
        drum,
        accuracy,
        correct: correctCount,
        total: targetSteps.length,
        wrong: wrongCount
      });
    });

    this.score = Math.round((correctDrums / totalSteps) * 100);
    this.showResult(feedback);
  }

  showResult(feedback) {
    const resultModal = document.getElementById('challengeResult');
    if (!resultModal) return;

    const passed = this.score >= 80;
    document.getElementById('resultScore').textContent = `${this.score}%`;
    document.getElementById('resultStatus').textContent = passed ? '🎉 PERFECT!' : '💪 Keep Practicing!';
    document.getElementById('resultStatus').style.color = passed ? '#4ade80' : '#fbbf24';

    let feedbackHTML = '<div class="feedback-grid">';
    feedback.forEach(f => {
      feedbackHTML += `
        <div class="feedback-item ${f.accuracy >= 80 ? 'success' : 'warning'}">
          <div class="feedback-drum">${f.drum.toUpperCase()}</div>
          <div class="feedback-accuracy">${f.accuracy}%</div>
          <div class="feedback-detail">${f.correct}/${f.total} correct</div>
          ${f.wrong > 0 ? `<div class="feedback-wrong">${f.wrong} extra clicks</div>` : ''}
        </div>
      `;
    });
    feedbackHTML += '</div>';

    document.getElementById('resultFeedback').innerHTML = feedbackHTML;
    resultModal.classList.add('active');

    if (this.score >= 80) {
      this.saveLeaderboard(this.currentChallenge.id, this.score);
    }
  }

  saveLeaderboard(challengeId, score) {
    if (!this.leaderboard[challengeId]) {
      this.leaderboard[challengeId] = [];
    }
    
    this.leaderboard[challengeId].push({
      score,
      date: new Date().toLocaleDateString()
    });

    this.leaderboard[challengeId].sort((a, b) => b.score - a.score);
    this.leaderboard[challengeId] = this.leaderboard[challengeId].slice(0, 5);

    localStorage.setItem('bakeryBeatsLeaderboard', JSON.stringify(this.leaderboard));
  }

  loadLeaderboard() {
    const saved = localStorage.getItem('bakeryBeatsLeaderboard');
    return saved ? JSON.parse(saved) : {};
  }

  getChallengesByDifficulty(difficulty) {
    return this.challenges.filter(c => c.difficulty === difficulty);
  }

  getRandomChallenge(difficulty = null) {
    let candidates = this.challenges;
    if (difficulty) {
      candidates = candidates.filter(c => c.difficulty === difficulty);
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  endChallenge() {
    this.isActive = false;
    this.hideChallengeUI();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.drumMachine) {
    window.bakingChallenge = new BakingChallenge(window.drumMachine);
  }
});