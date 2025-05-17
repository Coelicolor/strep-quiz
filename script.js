let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let userAnswers = [];
let userName = '';

fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    // สุ่มคำถาม 40 ข้อจาก 200 ข้อ
    questions = shuffleArray(data).slice(0, 40);
  });

function startQuiz() {
  userName = document.getElementById("username").value.trim();
  if (!userName) {
    alert("กรุณากรอกชื่อก่อนเริ่มแบบทดสอบ");
    return;
  }
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  showQuestion();
}

function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("question-title").textContent = `ข้อที่ ${currentQuestionIndex + 1}: ${q.question}`;
  const optionsList = document.getElementById("options");
  optionsList.innerHTML = '';
  document.getElementById("feedback").textContent = '';

  q.options.forEach((opt, index) => {
    const li = document.createElement('li');
    li.textContent = opt;
    li.onclick = () => {
      selectedOption = index;
      document.querySelectorAll('#options li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
    };
    optionsList.appendChild(li);
  });
}

function submitAnswer() {
  if (selectedOption === null) {
    alert("กรุณาเลือกคำตอบก่อน");
    return;
  }

  const q = questions[currentQuestionIndex];
  const isCorrect = selectedOption === q.answer;

  if (isCorrect) score++;

  userAnswers.push({
    question: q.question,
    correctAnswer: q.options[q.answer],
    userAnswer: q.options[selectedOption],
    isCorrect
  });

  selectedOption = null;
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";

  const percentage = Math.round((score / questions.length) * 100);
  document.getElementById("score-summary").textContent = `${userName} ได้คะแนน ${score}/${questions.length} (${percentage}%)`;

  const review = document.getElementById("review");
  userAnswers
    .filter(a => !a.isCorrect)
    .forEach(a => {
      const li = document.createElement("li");
      li.textContent = `คำถาม: ${a.question} | คำตอบของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
      review.appendChild(li);
    });
}

function downloadResults() {
  let csv = `ชื่อ,คะแนน,เปอร์เซ็นต์\n${userName},${score},${Math.round((score / questions.length) * 100)}%\n\n`;
  csv += "คำถาม,คำตอบของผู้เล่น,คำตอบที่ถูกต้อง\n";

  userAnswers.forEach(q => {
    csv += `"${q.question}","${q.userAnswer}","${q.correctAnswer}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ผลลัพธ์แบบทดสอบ.csv";
  link.click();
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
