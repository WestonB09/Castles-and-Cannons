const students = [
  { name: "Ryan", score: 0 },
  { name: "Joseph", score: 0 },
  { name: "Mary", score: 0 },
  { name: "Ella", score: 0 }
];

const questions = [
  {
    prompt: "What did you do after school yesterday?",
    choices: [
      "I played soccer with my friend.",
      "I like soccer yesterday after school.",
      "I am play with friend after school yesterday.",
      "My school yesterday is very fun."
    ],
    correctIndex: 0
  },
  {
    prompt: "What food do you like?",
    choices: [
      "I like pizza and fried chicken.",
      "I am liking food because tasty.",
      "My favorite eat is school lunch yesterday.",
      "I like because hungry every day."
    ],
    correctIndex: 0
  },
  {
    prompt: "What’s your favorite school subject?",
    choices: [
      "My favorite school subject is math.",
      "I favorite subject because school fun.",
      "My school subject are favorite lunch.",
      "Favorite is study in the classroom."
    ],
    correctIndex: 0
  }
];

let selectedStudentIndex = 0;

function renderStudentList() {
  const list = document.getElementById("studentList");
  list.innerHTML = "";

  students.forEach((student) => {
    const item = document.createElement("li");
    item.className = "student-item";
    item.innerHTML = `<span>${student.name}</span><span class="score">${student.score}</span>`;
    list.appendChild(item);
  });
}

function renderStudentSelect() {
  const select = document.getElementById("studentSelect");
  select.innerHTML = "";

  students.forEach((student, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = student.name;
    select.appendChild(option);
  });

  select.value = String(selectedStudentIndex);
  select.addEventListener("change", (event) => {
    selectedStudentIndex = Number(event.target.value);
  });
}

function handleAnswer(questionIndex, choiceIndex) {
  const question = questions[questionIndex];
  const feedback = document.getElementById(`feedback-${questionIndex}`);

  if (choiceIndex === question.correctIndex) {
    students[selectedStudentIndex].score += 2;
    feedback.textContent = `Correct! ${students[selectedStudentIndex].name} gets 2 points.`;
    feedback.className = "feedback correct";
  } else {
    feedback.textContent = "Incorrect. No points were added.";
    feedback.className = "feedback incorrect";
  }

  renderStudentList();
}

function renderQuiz() {
  const container = document.getElementById("quizContainer");
  container.innerHTML = "";

  questions.forEach((question, questionIndex) => {
    const card = document.createElement("article");
    card.className = "question-card";

    const title = document.createElement("h3");
    title.textContent = `${questionIndex + 1}. ${question.prompt}`;

    const answerList = document.createElement("ul");
    answerList.className = "answer-list";

    question.choices.forEach((choice, choiceIndex) => {
      const listItem = document.createElement("li");
      const button = document.createElement("button");
      button.className = "answer-btn";
      button.type = "button";
      button.textContent = choice;
      button.addEventListener("click", () => handleAnswer(questionIndex, choiceIndex));
      listItem.appendChild(button);
      answerList.appendChild(listItem);
    });

    const feedback = document.createElement("p");
    feedback.id = `feedback-${questionIndex}`;
    feedback.className = "feedback";

    card.appendChild(title);
    card.appendChild(answerList);
    card.appendChild(feedback);
    container.appendChild(card);
  });
}

renderStudentList();
renderStudentSelect();
renderQuiz();
