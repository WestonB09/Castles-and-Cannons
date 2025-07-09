
const students = [
  { name: "Ella", points: 0 },
  { name: "Joseph", points: 0 },
  { name: "Ryan", points: 0 },
  { name: "Mary", points: 0 }
];

function renderStudents() {
  const container = document.getElementById("students");
  container.innerHTML = "";
  students.forEach((student, index) => {
    const card = document.createElement("div");
    card.className = "student-card";
    card.innerHTML = \`
      <h3>\${student.name}</h3>
      <p>Points: <span id="points-\${index}">\${student.points}</span></p>
      <button onclick="addPoint(\${index})">+1 Point</button>
      <div id="sim-\${index}" class="simulation"></div>
    \`;
    container.appendChild(card);
  });
}

function addPoint(index) {
  students[index].points++;
  document.getElementById("points-" + index).innerText = students[index].points;

  if (students[index].points === 10) {
    const simDiv = document.getElementById("sim-" + index);
    const btn = document.createElement("button");
    btn.innerText = "Play Simulation!";
    btn.onclick = () => {
      simDiv.innerHTML = "🏰 💥 A knight storms the castle! 💥 🏰";
      setTimeout(() => {
        simDiv.innerHTML = "";
      }, 3000);
    };
    simDiv.appendChild(btn);
  }
}

renderStudents();
