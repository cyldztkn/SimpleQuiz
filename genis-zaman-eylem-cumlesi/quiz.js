class Quiz {
  constructor(quizData, pageSlug) {
    // Sayfa slug'ını kullanarak unique bir localStorage key oluştur
    this.storageKey = `quizState-${pageSlug}`;

    // Local Storage'dan son durumu al
    const savedState = this.getSavedState();

    this.questions = this.shuffleAndSelectQuestions(
      quizData.questions,
      savedState
    );
    this.totalQuestions = this.questions.length;
    this.currentQuestionIndex = savedState
      ? savedState.currentQuestionIndex
      : 0;
    this.correctAnswers = savedState ? savedState.correctAnswers : 0;
    this.incorrectAnswers = savedState ? savedState.incorrectAnswers : 0;

    this.quizElement = document.getElementById("quiz");
    this.resultElement = document.getElementById("result");
    this.nextButton = document.getElementById("next-btn");
    this.restartButton = document.getElementById("restart-btn");

    this.nextButton.addEventListener("click", () => this.nextQuestion());
    this.restartButton.addEventListener("click", () => this.restartQuiz());

    this.loadQuestion();
  }

  // Soruları karıştır ve sınırlı sayıda soru seç
  shuffleAndSelectQuestions(questions, savedState) {
    // Eğer daha önce kaydedilmiş bir durum varsa, o soruları kullan
    if (savedState && savedState.questions) {
      return savedState.questions;
    }

    // Soruları karıştır
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    // İlk 20 soruyu seç
    return shuffledQuestions;
  }

  // Local Storage'dan son durumu al
  getSavedState() {
    const savedQuizState = localStorage.getItem(this.storageKey);
    return savedQuizState ? JSON.parse(savedQuizState) : null;
  }

  // Mevcut durumu Local Storage'a kaydet
  saveState() {
    const state = {
      currentQuestionIndex: this.currentQuestionIndex,
      questions: this.questions,
      correctAnswers: this.correctAnswers,
      incorrectAnswers: this.incorrectAnswers,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  createProgressBar() {
    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressBar.id = "progress-bar";

    progressContainer.appendChild(progressBar);

    return progressContainer;
  }

  updateProgressBar() {
    const progressBar = document.getElementById("progress-bar");
    const progressPercentage =
      ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
    progressBar.style.width = `${progressPercentage}%`;
  }

  loadQuestion() {
    this.quizElement.innerHTML = "";
    this.nextButton.style.display = "none";

    if (this.currentQuestionIndex >= this.questions.length) {
      this.showResult();
      return;
    }

    const currentQuestion = this.questions[this.currentQuestionIndex];

    this.quizElement.innerHTML = `
      <div class="progress-container">
        <div class="progress-bar" id="progress-bar" style="width: ${
          (this.currentQuestionIndex / this.totalQuestions) * 100
        }%"></div>
      </div>
      <div class="question">
      <h2>Soru - ${this.currentQuestionIndex + 1} / ${this.totalQuestions}</h2>
      <p>${currentQuestion.question}</p>
      </div>
      <div class="options">
      ${currentQuestion.options
        .map((option) => `<div class="option">${option}</div>`)
        .join("")}
      </div>
      `;

    const optionElements = this.quizElement.querySelectorAll(".option");
    optionElements.forEach((optionEl) => {
      optionEl.addEventListener("click", (e) => this.selectOption(e));
    });

    // Durumu kaydet
    this.saveState();
  }

  selectOption(e) {
    const selectedOption = e.target;
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const optionElements = this.quizElement.querySelectorAll(".option");

    if (this.optionSelected) return;

    this.optionSelected = true;

    optionElements.forEach((el) => {
      el.removeEventListener("click", (e) => this.selectOption(e));
    });

    optionElements.forEach((el) => {
      if (el.textContent === currentQuestion.correctAnswer) {
        el.classList.add("correct");
      }
    });

    if (selectedOption.textContent === currentQuestion.correctAnswer) {
      selectedOption.classList.add("correct");
      this.correctAnswers++;
    } else {
      selectedOption.classList.add("incorrect");
      this.incorrectAnswers++;
    }

    this.nextButton.style.display = "block";

    // Durumu kaydet
    this.saveState();
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.optionSelected = false;
    this.loadQuestion();
  }

  showResult() {
    this.quizElement.innerHTML = "";
    this.nextButton.style.display = "none";
    this.restartButton.style.display = "block";

    this.resultElement.innerHTML = `
        <h2>Quiz Sonucu</h2>
        <p>Toplam Soru: ${this.totalQuestions}</p>
        <p>Doğru Cevap: ${this.correctAnswers}</p>
        <p>Yanlış Cevap: ${this.incorrectAnswers}</p>
      `;

    // Local Storage'daki quiz durumunu temizle
    localStorage.removeItem(this.storageKey);
  }

  restartQuiz() {
    // Local Storage'daki quiz durumunu temizle
    localStorage.removeItem(this.storageKey);

    // Quiz'i sıfırla
    this.currentQuestionIndex = 0;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
    this.optionSelected = false;
    this.resultElement.innerHTML = "";
    this.restartButton.style.display = "none";

    // Yeni bir fetch gerekiyorsa, fetching fonksiyonunu çağırabilirsiniz
    fetching(pageSlug);
  }
}

let pageSlug = document.currentScript.getAttribute("data-slug") || "default";
let fetching = async (slug) => {
  try {
    console.log("fetch çalıştı");
    let response = await fetch(`./questions-${slug}.json`);
    let data = await response.json();

    new Quiz(data, slug);
  } catch (error) {
    console.error("Soru yüklenirken hata oluştu:", error);
  }
};

// Sayfa yüklendiğinde quiz'i başlat
fetching(pageSlug);
