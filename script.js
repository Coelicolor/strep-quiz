// script.js

// ตัวแปรหลัก
let questions = [];
let loaded = false;
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let userAnswers = [];
let userName = '';
let currentChoices = [];

// Fisher–Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// โหลดคำถาม
fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(q => {
      q.answerIndex = Number(q.answer) - 1;        // JSON ให้ 1-based => zero-based
      q.correctText = q.options[q.answerIndex];
    });
    questions = shuffle(data).slice(0, 25);
    loaded = true;
    const btn = document.getElementById('start-btn');
    if (btn) btn.disabled = false;
  })
  .catch(err => {
    console.error('โหลดคำถามไม่สำเร็จ:', err);
    alert('ไม่สามารถโหลดคำถาม กรุณาลองใหม่ภายหลัง');
  });

// เริ่มแบบทดสอบ
function startQuiz() {
  if (!loaded) {
    alert('กำลังโหลดคำถาม รอสักครู่...');
    return;
  }
  userName = document.getElementById("username").value.trim();
  if (!userName) {
    alert("กรุณากรอกชื่อก่อนเริ่มแบบทดสอบ");
    return;
  }
  // ซ่อนหน้าเริ่มต้น
  document.getElementById("start-screen").style.display = "none";
  // รีเซ็ตข้อมูล
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
  // แสดงหน้าทำแบบทดสอบ
  document.getElementById("quiz-screen").style.display = "block";
  showQuestion();
}

// แสดงคำถาม
function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("question-title").textContent =
    `ข้อที่ ${currentQuestionIndex + 1}: ${q.question}`;

  const opts = document.getElementById("options");
  opts.innerHTML = '';
  document.getElementById("feedback").textContent = '';
  selectedOption = null;

  // สร้าง currentChoices พร้อมดัชนีดั้งเดิม
  currentChoices = q.options.map((text, idx) => ({ text, index: idx }));
  currentChoices = shuffle(currentChoices);

  currentChoices.forEach((choice, displayIdx) => {
    const li = document.createElement('li');
    li.textContent = choice.text;
    li.onclick = () => {
      selectedOption = displayIdx;
      document.querySelectorAll('#options li')
        .forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
    };
    opts.appendChild(li);
  });
}

// ตรวจคำตอบ
function submitAnswer() {
  if (selectedOption === null) {
    alert("กรุณาเลือกคำตอบก่อน");
    return;
  }

  const q = questions[currentQuestionIndex];
  const choice = currentChoices[selectedOption];
  const isCorrect = choice.index === q.answerIndex;

  // เก็บผล
  userAnswers.push({
    question: q.question,
    userAnswer: choice.text,
    correctAnswer: q.correctText,
    isCorrect
  });
  if (isCorrect) score++;

  // feedback
  document.getElementById("feedback").textContent =
    isCorrect ? "😊 ถูกต้อง!" : `😢 ผิด! เฉลย: ${q.correctText}`;

  // รอ 1 วิ แล้วไปข้อถัดไป
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }, 1000);
}

// แสดงผลลัพธ์
function showResults() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";

  const percentage = Math.round((score / questions.length) * 100);
  document.getElementById("score-summary").textContent =
    `${userName} ได้คะแนน ${score}/${questions.length} (${percentage}%)`;

  const review = document.getElementById("review");
  review.innerHTML = '';
  userAnswers.filter(a => !a.isCorrect).forEach(a => {
    const li = document.createElement('li');
    li.textContent = `คำถาม: ${a.question} | ของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
    review.appendChild(li);
  });
}

// เริ่มใหม่อีกครั้ง
function restartQuiz() {
  // ซ่อนหน้า result
  document.getElementById("result-screen").style.display = "none";
  // แสดงหน้า start ใหม่
  document.getElementById("start-screen").style.display = "block";
}
