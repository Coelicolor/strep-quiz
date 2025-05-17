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
  document.getElementById("start-screen").style.display = "none";
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];
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

  userAnswers.push({
    question: q.question,
    userAnswer: choice.text,
    correctAnswer: q.correctText,
    isCorrect
  });
  if (isCorrect) score++;

  document.getElementById("feedback").textContent =
    isCorrect ? "😊 ถูกต้อง!" : `😢 ผิด! เฉลย: ${q.correctText}`;

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

  const reviewEl = document.getElementById("review");
  reviewEl.innerHTML = '';
  let reviewText = '';

  userAnswers.filter(a => !a.isCorrect).forEach(a => {
    const li = document.createElement('li');
    const text = `คำถาม: ${a.question} | ของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
    li.textContent = text;
    reviewEl.appendChild(li);
    reviewText += text + '\n';
  });

  // ส่งผลลัพธ์ไป Google Sheets ทันทีที่แสดงผล
  sendResultsToGoogleSheets(userName, score, percentage, reviewText);
}

// เริ่มใหม่อีกครั้ง
function restartQuiz() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
}

// ปรับ sendResultsToGoogleSheets ให้ใช้ viewform?usp=pp_url&entry...
function sendResultsToGoogleSheets(name, score, percentage, reviewText) {
  // base URL ของ Google Form (viewform) พร้อม prefill
  const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSedQrXdAmyZPZga6X46kY6SXcVtvxFX5YknT5VBMgMSwFe3Rg/viewform?usp=pp_url';
  // สร้าง query parameters
  const params = new URLSearchParams({
    'entry.1964442273': name,
    'entry.1111191378': score,
    'entry.366131963': percentage,
    'entry.2106468144': reviewText
  });
  // ยิง GET (no-cors) เพื่อบันทึกข้อมูล
  fetch(`${baseUrl}&${params.toString()}`, {
    method: 'GET',
    mode: 'no-cors'
  })
    .then(() => console.log('ส่งข้อมูลไป Google Forms เรียบร้อย'))
    .catch(err => console.error('ส่งข้อมูลไม่สำเร็จ', err));
}
