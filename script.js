let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let userAnswers = [];
let userName = '';
let currentChoices = [];

// โหลดคำถาม แปลง answer เป็น Number แล้วสุ่ม 25 ข้อ
fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    // แปลง answer เป็น Number
    data.forEach(q => { q.answer = Number(q.answer) - 1; }); // แปลงให้ zero-based
    // สุ่มและเลือก 25 ข้อ
    questions = fisherYatesShuffle(data).slice(0, 25);
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
  document.getElementById("question-title").textContent =
    `ข้อที่ ${currentQuestionIndex + 1}: ${q.question}`;

  const optionsList = document.getElementById("options");
  optionsList.innerHTML = '';
  selectedOption = null;
  document.getElementById("feedback").textContent = '';

  // สร้าง list ของ choices พร้อม original index แล้วสุ่ม
  currentChoices = q.options.map((text, idx) => ({ text, index: idx }));
  currentChoices = fisherYatesShuffle(currentChoices);

  currentChoices.forEach((choice, idx) => {
    const li = document.createElement('li');
    li.textContent = choice.text;
    li.onclick = () => {
      selectedOption = idx;
      document.querySelectorAll('#options li').forEach(el =>
        el.classList.remove('selected')
      );
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
  const selectedChoice = currentChoices[selectedOption];
  const correctIndex = q.answer;
  const isCorrect = selectedChoice.index === correctIndex;

  // เก็บผลลัพธ์
  userAnswers.push({
    question: q.question,
    correctAnswer: q.options[correctIndex],
    userAnswer: selectedChoice.text,
    isCorrect
  });

  if (isCorrect) {
    score++;
    document.getElementById("feedback").textContent = "😊 ถูกต้อง!";
  } else {
    document.getElementById("feedback").textContent =
      `😢 ผิด! เฉลยคือ: ${q.options[correctIndex]}`;
  }

  // รอให้ดู feedback 1 วิ แล้วไปข้อต่อไป
  setTimeout(() => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
      showQuestion();
    } else {
      showResults();
    }
  }, 1000);
}

function showResults() {
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("result-screen").style.display = "block";

  const percentage = Math.round((score / questions.length) * 100);
  document.getElementById("score-summary").textContent =
    `${userName} ได้คะแนน ${score}/${questions.length} (${percentage}%)`;

  const review = document.getElementById("review");
  review.innerHTML = '';
  let reviewText = '';

  userAnswers.filter(a => !a.isCorrect).forEach(a => {
    const text = `คำถาม: ${a.question} | คำตอบคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
    reviewText += text + "\n";
    const li = document.createElement("li");
    li.textContent = text;
    review.appendChild(li);
  });

  sendResultsToGoogleSheets(userName, score, percentage, reviewText);
}

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

// Fisher–Yates shuffle
function fisherYatesShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
    .then(() => console.log('ส่งข้อมูลไป Google Sheets เรียบร้อยแล้ว'))
    .catch(err => console.error('ส่งข้อมูลไม่สำเร็จ', err));
}
