export function renderQuiz(quizData, containerElement) {
  // Clear out whatever was there before
  containerElement.innerHTML = '';

  if (!quizData) return;

  // Check the type of quiz and render accordingly
  if (quizData.type === 'wordle') {
    renderWordle(quizData, containerElement);
  } else {
    // Default / Standard Multiple Choice Quiz
    renderStandardQuiz(quizData, containerElement);
  }
}

// 1. Render Cosmic Wordle
function renderWordle(data, container) {
  container.innerHTML = `
    <div class="quiz-box wordle-box">
      <h3>Cosmic Wordle</h3>
      <p class="hint">${data.hint}</p>
      <form id="wordle-form">
        <input type="text" id="wordle-input" maxlength="5" placeholder="5 letters" autocomplete="off" />
        <button type="submit">Guess</button>
      </form>
      <p id="wordle-status" class="status-msg"></p>
    </div>
  `;

  const form = container.querySelector('#wordle-form');
  const input = container.querySelector('#wordle-input');
  const status = container.querySelector('#wordle-status');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userGuess = input.value.trim().toUpperCase();

    if (userGuess === data.targetWord) {
      status.style.color = '#4ade80';
      status.textContent = 'Correct! ' + data.explain;
      input.disabled = true;
    } else {
      status.style.color = '#f87171';
      status.textContent = 'Try again! Hint: ' + data.hint;
    }
  });
}

// 2. Render Standard Multiple Choice Quiz
function renderStandardQuiz(data, container) {
  let optionsHTML = data.options.map((opt, idx) => `
    <button class="quiz-option-btn" data-index="${idx}">${opt}</button>
  `).join('');

  container.innerHTML = `
    <div class="quiz-box standard-box">
      <h3>${data.q}</h3>
      <div class="options-container">${optionsHTML}</div>
      <p id="quiz-status" class="status-msg"></p>
    </div>
  `;

  const status = container.querySelector('#quiz-status');
  const buttons = container.querySelectorAll('.quiz-option-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedIdx = parseInt(e.target.getAttribute('data-index'));
      
      buttons.forEach(b => b.disabled = true); // Lock buttons after guess

      if (selectedIdx === data.answer) {
        e.target.style.backgroundColor = '#166534'; // Green for correct
        status.style.color = '#4ade80';
        status.textContent = data.explain;
      } else {
        e.target.style.backgroundColor = '#991b1b'; // Red for wrong
        buttons[data.answer].style.backgroundColor = '#166534'; // Highlight correct one
        status.style.color = '#f87171';
        status.textContent = 'Not quite! Take another look at the story above.';
      }
    });
  });
}