// --- กำหนดตัวแปรหลัก ---
let questions = [];
let loaded = false;
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let userAnswers = [];
let userName = '';
let currentChoices = [];

// --- ฟังก์ชันช่วยสุ่ม Fisher–Yates ---
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- โหลด questions.json พร้อม map answer เป็น Number ---
fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    // แปลง answer ให้เป็น Number (zero-based อยู่แล้วถ้า JSON ให้ 1=ตัวที่ 2)
    data.forEach(q => q.answer = Number(q.answer));
    questions = shuffle(data).slice(0, 25);
    loaded = true;
document.getElementById('start-btn').disabled = false;
  })
  .catch(err => {
    console.error('โหลดคำถามไม่สำเร็จ', err);
    alert('ไม่สามารถโหลดคำถามได้ กรุณาลองใหม่ภายหลัง');
  });

// --- เริ่ม Quiz (ตรวจสอบว่าคำถามโหลดเสร็จแล้ว) ---
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

// --- แสดงคำถามปัจจุบัน ---
function showQuestion() {
  const q = questions[currentQuestionIndex];
  document.getElementById("question-title").textContent =
    `ข้อที่ ${currentQuestionIndex + 1}: ${q.question}`;

  const opts = document.getElementById("options");
  opts.innerHTML = '';
  selectedOption = null;
  document.getElementById("feedback").textContent = '';

  // สร้าง array ของ choices พร้อม original index แล้วสับ
  currentChoices = q.options.map((text, idx) => ({ text, idx }));
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

// --- ส่งคำตอบและตรวจสอบ ---
function submitAnswer() {
  if (selectedOption === null) {
    alert("กรุณาเลือกคำตอบก่อน");
    return;
  }

  const q = questions[currentQuestionIndex];
  const choice = currentChoices[selectedOption];
  const isCorrect = choice.idx === q.answer;

  // เก็บผล
  userAnswers.push({
    question: q.question,
    userAnswer: choice.text,
    correctAnswer: q.options[q.answer],
    isCorrect
  });
  if (isCorrect) score++;

  // แสดง feedback เร็วๆ นี้
  document.getElementById("feedback").textContent =
    isCorrect ? "😊 ถูกต้อง!" : `😢 ผิด! เฉลย: ${q.options[q.answer]}`;

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

// --- สรุปผล ---
function showResults() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";
  const pct = Math.round((score / questions.length) * 100);
  document.getElementById("score-summary").textContent =
    `${userName} ได้ ${score}/${questions.length} (${pct}%)`;

  const review = document.getElementById("review");
  review.innerHTML = '';
  userAnswers.filter(a => !a.isCorrect).forEach(a => {
    const li = document.createElement('li');
    li.textContent = `คำถาม: ${a.question} | ของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
    review.appendChild(li);
  });

  // ส่งข้อมูล
  sendResultsToGoogleSheets(userName, score, pct,
    review.textContent);
}

// --- อื่นๆ (download, Google Sheets) เหมือนเดิม ---
function downloadResults() { /* … */ }
function sendResultsToGoogleSheets(name, score, pct, reviewText) { /* … */ }
