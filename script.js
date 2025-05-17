let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let userAnswers = [];
let userName = '';
let currentChoices = []; // เก็บ choices ที่สับแล้ว

// โหลดคำถามและสุ่ม 25 ข้อ
fetch('questions.json')
  .then(res => res.json())
  .then(data => {
    questions = shuffleArray(data).slice(0, 25);
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
  document.getElementById("feedback").textContent = '';
  selectedOption = null;

  // สร้าง choices พร้อม original index แล้วสุ่มลำดับ
  currentChoices = q.options.map((text, idx) => ({ text, index: idx }));
  currentChoices = shuffleArray(currentChoices);

  currentChoices.forEach((choice, idx) => {
    const li = document.createElement('li');
    li.textContent = choice.text;
    li.onclick = () => {
      selectedOption = idx;
      document.querySelectorAll('#options li')
        .forEach(el => el.classList.remove('selected'));
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
  const correctIndex = Number(q.answer);            // แปลงเป็น Number เผื่อ JSON เป็นสตริง
  const isCorrect = selectedChoice.index === correctIndex;

  // เก็บผลลัพธ์
  userAnswers.push({
    question: q.question,
    correctAnswer: q.options[correctIndex],
    userAnswer: selectedChoice.text,
    isCorrect
  });

  if (isCorrect) score++;

  // เคลียร์ selection และขึ้นข้อถัดไป
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
  document.getElementById("score-summary").textContent =
    `${userName} ได้คะแนน ${score}/${questions.length} (${percentage}%)`;

  const review = document.getElementById("review");
  review.innerHTML = '';
  let reviewText = '';

  userAnswers
    .filter(a => !a.isCorrect)
    .forEach(a => {
      const text = `คำถาม: ${a.question} | คำตอบของคุณ: ${a.userAnswer} | เฉลย: ${a.correctAnswer}`;
      reviewText += text + "\n";
      const li = document.createElement("li");
      li.textContent = text;
      review.appendChild(li);
    });

  sendResultsToGoogleSheets(userName, score, percentage, reviewText);
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
