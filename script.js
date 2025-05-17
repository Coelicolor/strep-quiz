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
    // แปลง answer เป็น Number เก็บใน answerIndex
    data.forEach(q => {
      q.answerIndex = Number(q.answer);
      q.correctText = q.options[q.answerIndex];
    });
    // สุ่ม 25 ข้อ
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

  // สร้าง currentChoices เก็บข้อความ + ดัชนีดั้งเดิม
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
  const correctText = q.correctText;

  // เก็บผล
  userAnswers.push({
    question: q.question,
    userAnswer: choice.text,
    correctAnswer: correctText,
    isCorrect
  });
  if (isCorrect) score++;

  // feedback
  document.getElementById("feedback").textContent =
    isCorrect
      ? "😊 ถูกต้อง!"
      : `😢 ผิด! เฉลย: ${correctText}`;

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
  userAnswers
    .filter(a => !a.isCorrect)
    .forEach(a => {
      const li = document.createElement('li');
      li.textContent =
        `คำถาม: ${a.question} | ของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
      review.appendChild(li);
    });

  sendResultsToGoogleSheets(userName, score, percentage, review.textContent);
}

// ดาวน์โหลด CSV
function downloadResults() {
  let csv = `ชื่อ,คะแนน,เปอร์เซ็นต์\n${userName},${score},${Math.round((score / questions.length) * 100)}%\n\n`;
  csv += "คำถาม,คำตอบคุณ,เฉลย\n";
  userAnswers.forEach(a => {
    csv += `"${a.question}","${a.userAnswer}","${a.correctAnswer}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ผลลัพธ์แบบทดสอบ.csv";
  link.click();
}

// ส่งผลไป Google Forms/Sheets
function sendResultsToGoogleSheets(name, score, percentage, reviewText) {
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSedQrXdAmyZPZga6X46kY6SXcVtvxFX5YknT5VBMgMSwFe3Rg/formResponse';
  const formData = new URLSearchParams();
  formData.append('entry.1964442273', name);
  formData.append('entry.1111191378', score);
  formData.append('entry.366131963', percentage);
  formData.append('entry.2106468144', reviewText);

  fetch(formUrl, {
    method: 'POST',
    body: formData,
    mode: 'no-cors'
  })
    .then(() => console.log('ส่งข้อมูลไป Google Sheets เรียบร้อย'))
    .catch(err => console.error('ส่งข้อมูลไม่สำเร็จ', err));
}
