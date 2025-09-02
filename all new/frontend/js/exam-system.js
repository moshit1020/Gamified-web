// Exam System for EduQuest
class ExamSystem {
    constructor() {
        this.currentExam = null;
        this.currentQuestionIndex = 0;
        this.examAnswers = [];
        this.examStartTime = null;
        this.celebrationContainer = null;
    }

    // Initialize exam system
    init() {
        this.celebrationContainer = document.getElementById('celebration') || this.createCelebrationContainer();
    }

    // Create celebration container if it doesn't exist
    createCelebrationContainer() {
        const container = document.createElement('div');
        container.id = 'celebration';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Start an exam
    startExam(subjectKey, lessonId) {
        const subject = stemSubjects[subjectKey];
        const lesson = subject.lessons.find(l => l.id === lessonId);
        
        if (!lesson) return;

        this.currentExam = {
            subjectKey,
            lessonId,
            difficulty: lesson.examDifficulty,
            questions: this.generateExamQuestions(subjectKey, lesson.examDifficulty),
            subjectName: subject.name
        };
        
        this.currentQuestionIndex = 0;
        this.examAnswers = [];
        this.examStartTime = Date.now();
        
        this.showExamModal();
    }

    // Generate exam questions based on subject and difficulty
    generateExamQuestions(subjectKey, difficulty) {
        const questions = [];
        const questionCount = difficulty === 'easy' ? 5 : 8;
        
        // Question templates for different subjects
        const questionTemplates = {
            math: {
                easy: [
                    {
                        question: "What is 5 + 3?",
                        options: ["6", "7", "8", "9"],
                        correct: 2,
                        explanation: "5 + 3 = 8"
                    },
                    {
                        question: "What is 10 - 4?",
                        options: ["5", "6", "7", "8"],
                        correct: 1,
                        explanation: "10 - 4 = 6"
                    },
                    {
                        question: "What is 2 × 3?",
                        options: ["5", "6", "7", "8"],
                        correct: 1,
                        explanation: "2 × 3 = 6"
                    },
                    {
                        question: "What is 12 ÷ 3?",
                        options: ["3", "4", "5", "6"],
                        correct: 1,
                        explanation: "12 ÷ 3 = 4"
                    },
                    {
                        question: "What is 7 + 6?",
                        options: ["12", "13", "14", "15"],
                        correct: 1,
                        explanation: "7 + 6 = 13"
                    }
                ],
                moderate: [
                    {
                        question: "What is 15% of 200?",
                        options: ["25", "30", "35", "40"],
                        correct: 1,
                        explanation: "15% of 200 = 0.15 × 200 = 30"
                    },
                    {
                        question: "Solve for x: 2x + 5 = 13",
                        options: ["3", "4", "5", "6"],
                        correct: 1,
                        explanation: "2x + 5 = 13, so 2x = 8, therefore x = 4"
                    },
                    {
                        question: "What is the area of a rectangle with length 8 and width 5?",
                        options: ["35", "40", "45", "50"],
                        correct: 1,
                        explanation: "Area = length × width = 8 × 5 = 40"
                    },
                    {
                        question: "What is √64?",
                        options: ["6", "7", "8", "9"],
                        correct: 2,
                        explanation: "√64 = 8 because 8² = 64"
                    },
                    {
                        question: "What is 3² + 4²?",
                        options: ["20", "25", "30", "35"],
                        correct: 1,
                        explanation: "3² + 4² = 9 + 16 = 25"
                    },
                    {
                        question: "What is the perimeter of a square with side length 6?",
                        options: ["20", "24", "28", "32"],
                        correct: 1,
                        explanation: "Perimeter = 4 × side = 4 × 6 = 24"
                    },
                    {
                        question: "What is 0.5 × 0.4?",
                        options: ["0.1", "0.2", "0.3", "0.4"],
                        correct: 1,
                        explanation: "0.5 × 0.4 = 0.2"
                    },
                    {
                        question: "What is 2³?",
                        options: ["6", "8", "10", "12"],
                        correct: 1,
                        explanation: "2³ = 2 × 2 × 2 = 8"
                    }
                ]
            },
            science: {
                easy: [
                    {
                        question: "What is the chemical symbol for water?",
                        options: ["H2O", "CO2", "O2", "H2"],
                        correct: 0,
                        explanation: "Water is H2O - two hydrogen atoms and one oxygen atom"
                    },
                    {
                        question: "What planet is closest to the Sun?",
                        options: ["Venus", "Earth", "Mercury", "Mars"],
                        correct: 2,
                        explanation: "Mercury is the closest planet to the Sun"
                    },
                    {
                        question: "What gas do plants produce during photosynthesis?",
                        options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
                        correct: 1,
                        explanation: "Plants produce oxygen during photosynthesis"
                    },
                    {
                        question: "What is the largest organ in the human body?",
                        options: ["Liver", "Heart", "Skin", "Brain"],
                        correct: 2,
                        explanation: "The skin is the largest organ in the human body"
                    },
                    {
                        question: "What is the freezing point of water in Celsius?",
                        options: ["-1°C", "0°C", "1°C", "2°C"],
                        correct: 1,
                        explanation: "Water freezes at 0°C"
                    }
                ],
                moderate: [
                    {
                        question: "What is the process by which plants make their own food?",
                        options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
                        correct: 1,
                        explanation: "Photosynthesis is how plants convert sunlight into energy"
                    },
                    {
                        question: "What is the speed of light in a vacuum?",
                        options: ["299,792,458 m/s", "300,000,000 m/s", "299,000,000 m/s", "301,000,000 m/s"],
                        correct: 0,
                        explanation: "The speed of light in a vacuum is exactly 299,792,458 m/s"
                    },
                    {
                        question: "What is the chemical symbol for gold?",
                        options: ["Go", "Gd", "Au", "Ag"],
                        correct: 2,
                        explanation: "Au is the chemical symbol for gold (from Latin 'aurum')"
                    },
                    {
                        question: "What type of energy is stored in a battery?",
                        options: ["Kinetic", "Potential", "Thermal", "Sound"],
                        correct: 1,
                        explanation: "Batteries store chemical potential energy"
                    },
                    {
                        question: "What is the pH of pure water?",
                        options: ["6", "7", "8", "9"],
                        correct: 1,
                        explanation: "Pure water has a pH of 7, which is neutral"
                    },
                    {
                        question: "What is the unit of electrical resistance?",
                        options: ["Volt", "Ampere", "Ohm", "Watt"],
                        correct: 2,
                        explanation: "The unit of electrical resistance is the Ohm (Ω)"
                    },
                    {
                        question: "What is the most abundant gas in Earth's atmosphere?",
                        options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"],
                        correct: 2,
                        explanation: "Nitrogen makes up about 78% of Earth's atmosphere"
                    },
                    {
                        question: "What is the process of a liquid turning into a gas?",
                        options: ["Condensation", "Evaporation", "Sublimation", "Deposition"],
                        correct: 1,
                        explanation: "Evaporation is the process of a liquid turning into a gas"
                    }
                ]
            },
            technology: {
                easy: [
                    {
                        question: "What does CPU stand for?",
                        options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "Computer Program Unit"],
                        correct: 0,
                        explanation: "CPU stands for Central Processing Unit"
                    },
                    {
                        question: "What is the main function of RAM?",
                        options: ["Long-term storage", "Temporary storage", "Processing", "Display"],
                        correct: 1,
                        explanation: "RAM provides temporary storage for data being processed"
                    },
                    {
                        question: "What does HTML stand for?",
                        options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Markup Language"],
                        correct: 0,
                        explanation: "HTML stands for HyperText Markup Language"
                    },
                    {
                        question: "What is a computer virus?",
                        options: ["A helpful program", "A harmful program", "A type of hardware", "A type of network"],
                        correct: 1,
                        explanation: "A computer virus is a harmful program that can damage your computer"
                    },
                    {
                        question: "What does URL stand for?",
                        options: ["Uniform Resource Locator", "Universal Resource Link", "Uniform Resource Link", "Universal Resource Locator"],
                        correct: 0,
                        explanation: "URL stands for Uniform Resource Locator"
                    }
                ],
                moderate: [
                    {
                        question: "What is the difference between HTTP and HTTPS?",
                        options: ["No difference", "HTTPS is more secure", "HTTP is faster", "HTTPS is older"],
                        correct: 1,
                        explanation: "HTTPS includes SSL/TLS encryption, making it more secure than HTTP"
                    },
                    {
                        question: "What is the purpose of a firewall?",
                        options: ["To speed up internet", "To block unauthorized access", "To store files", "To display websites"],
                        correct: 1,
                        explanation: "A firewall blocks unauthorized access to your network"
                    },
                    {
                        question: "What is cloud computing?",
                        options: ["Computing in the sky", "Using remote servers", "Using only local storage", "A type of hardware"],
                        correct: 1,
                        explanation: "Cloud computing uses remote servers to store and process data"
                    },
                    {
                        question: "What is the difference between software and hardware?",
                        options: ["No difference", "Software is physical, hardware is not", "Hardware is physical, software is not", "Both are the same"],
                        correct: 2,
                        explanation: "Hardware is physical components, software is programs and data"
                    },
                    {
                        question: "What is an algorithm?",
                        options: ["A type of computer", "A step-by-step procedure", "A programming language", "A type of file"],
                        correct: 1,
                        explanation: "An algorithm is a step-by-step procedure for solving a problem"
                    },
                    {
                        question: "What is the purpose of a database?",
                        options: ["To display websites", "To store and organize data", "To process images", "To connect to internet"],
                        correct: 1,
                        explanation: "A database stores and organizes data for easy retrieval"
                    },
                    {
                        question: "What is machine learning?",
                        options: ["Learning about machines", "Computers learning from data", "Building machines", "Repairing machines"],
                        correct: 1,
                        explanation: "Machine learning is when computers learn patterns from data"
                    },
                    {
                        question: "What is the Internet of Things (IoT)?",
                        options: ["Internet for computers only", "Connected everyday devices", "A type of website", "A programming language"],
                        correct: 1,
                        explanation: "IoT refers to everyday devices connected to the internet"
                    }
                ]
            },
            engineering: {
                easy: [
                    {
                        question: "What is the purpose of a lever?",
                        options: ["To store energy", "To multiply force", "To create heat", "To measure distance"],
                        correct: 1,
                        explanation: "A lever multiplies force to make work easier"
                    },
                    {
                        question: "What is the strongest shape in engineering?",
                        options: ["Circle", "Square", "Triangle", "Rectangle"],
                        correct: 2,
                        explanation: "Triangles are the strongest shape because they distribute force evenly"
                    },
                    {
                        question: "What does CAD stand for?",
                        options: ["Computer Aided Design", "Computer Assisted Drawing", "Central Area Design", "Computer Area Drawing"],
                        correct: 0,
                        explanation: "CAD stands for Computer Aided Design"
                    },
                    {
                        question: "What is the purpose of a gear?",
                        options: ["To store energy", "To transfer motion and force", "To create electricity", "To measure speed"],
                        correct: 1,
                        explanation: "Gears transfer motion and force between rotating parts"
                    },
                    {
                        question: "What is a blueprint?",
                        options: ["A type of paint", "A detailed technical drawing", "A type of paper", "A measurement tool"],
                        correct: 1,
                        explanation: "A blueprint is a detailed technical drawing used in engineering"
                    }
                ],
                moderate: [
                    {
                        question: "What is the difference between stress and strain?",
                        options: ["No difference", "Stress is force, strain is deformation", "Strain is force, stress is deformation", "Both are the same"],
                        correct: 1,
                        explanation: "Stress is the force applied, strain is the resulting deformation"
                    },
                    {
                        question: "What is the purpose of a bearing?",
                        options: ["To store energy", "To reduce friction", "To increase speed", "To measure force"],
                        correct: 1,
                        explanation: "Bearings reduce friction between moving parts"
                    },
                    {
                        question: "What is the principle behind hydraulic systems?",
                        options: ["Pascal's principle", "Newton's law", "Einstein's theory", "Darwin's theory"],
                        correct: 0,
                        explanation: "Hydraulic systems work on Pascal's principle of fluid pressure"
                    },
                    {
                        question: "What is the difference between compression and tension?",
                        options: ["No difference", "Compression pushes, tension pulls", "Tension pushes, compression pulls", "Both are the same"],
                        correct: 1,
                        explanation: "Compression is pushing force, tension is pulling force"
                    },
                    {
                        question: "What is the purpose of a heat exchanger?",
                        options: ["To generate heat", "To transfer heat between fluids", "To store heat", "To measure temperature"],
                        correct: 1,
                        explanation: "Heat exchangers transfer heat between two or more fluids"
                    },
                    {
                        question: "What is the difference between efficiency and effectiveness?",
                        options: ["No difference", "Efficiency is doing things right, effectiveness is doing the right things", "Effectiveness is doing things right, efficiency is doing the right things", "Both are the same"],
                        correct: 1,
                        explanation: "Efficiency is doing things right, effectiveness is doing the right things"
                    },
                    {
                        question: "What is the purpose of a circuit breaker?",
                        options: ["To generate electricity", "To protect electrical circuits", "To store energy", "To measure voltage"],
                        correct: 1,
                        explanation: "Circuit breakers protect electrical circuits from damage"
                    },
                    {
                        question: "What is the difference between renewable and non-renewable energy?",
                        options: ["No difference", "Renewable can be replenished, non-renewable cannot", "Non-renewable can be replenished, renewable cannot", "Both are the same"],
                        correct: 1,
                        explanation: "Renewable energy can be replenished naturally, non-renewable cannot"
                    }
                ]
            }
        };

        const templates = questionTemplates[subjectKey] || questionTemplates.math;
        const difficultyQuestions = templates[difficulty] || templates.easy;
        
        // Shuffle and select questions
        const shuffled = [...difficultyQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, questionCount).map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation
        }));
    }

    // Show exam modal
    showExamModal() {
        const modal = document.getElementById('examModal');
        if (!modal) {
            this.createExamModal();
        }
        
        const title = document.getElementById('examTitle');
        const body = document.getElementById('examBody');
        
        title.textContent = `${this.currentExam.subjectName} Exam`;
        body.innerHTML = this.generateExamHTML();
        
        document.getElementById('examModal').style.display = 'flex';
    }

    // Create exam modal if it doesn't exist
    createExamModal() {
        const modalHTML = `
            <div class="modal-overlay" id="examModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="examTitle">Exam</h3>
                        <button class="modal-close" onclick="examSystem.closeExamModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="examBody">
                        <!-- Exam content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Generate exam HTML
    generateExamHTML() {
        const question = this.currentExam.questions[this.currentQuestionIndex];
        const progress = ((this.currentQuestionIndex + 1) / this.currentExam.questions.length) * 100;
        
        return `
            <div class="question-container">
                <div class="question">${question.question}</div>
                <div class="options">
                    ${question.options.map((option, index) => `
                        <div class="option" onclick="examSystem.selectAnswer(${index})">
                            <div class="option-letter">${String.fromCharCode(65 + index)}</div>
                            <div>${option}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="exam-navigation">
                <div class="exam-progress">
                    Question ${this.currentQuestionIndex + 1} of ${this.currentExam.questions.length}
                </div>
                <div class="exam-buttons">
                    <button class="btn btn-secondary" onclick="examSystem.previousQuestion()" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left"></i> Previous
                    </button>
                    <button class="btn btn-primary" onclick="examSystem.nextQuestion()" id="nextBtn" disabled>
                        ${this.currentQuestionIndex === this.currentExam.questions.length - 1 ? 'Finish Exam' : 'Next'} 
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Select an answer
    selectAnswer(optionIndex) {
        // Remove previous selection
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        document.querySelectorAll('.option')[optionIndex].classList.add('selected');
        
        // Store answer
        this.examAnswers[this.currentQuestionIndex] = optionIndex;
        
        // Enable next button
        document.getElementById('nextBtn').disabled = false;
    }

    // Go to next question
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentExam.questions.length - 1) {
            this.currentQuestionIndex++;
            document.getElementById('examBody').innerHTML = this.generateExamHTML();
        } else {
            this.finishExam();
        }
    }

    // Go to previous question
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            document.getElementById('examBody').innerHTML = this.generateExamHTML();
            
            // Restore previous answer if exists
            if (this.examAnswers[this.currentQuestionIndex] !== undefined) {
                document.querySelectorAll('.option')[this.examAnswers[this.currentQuestionIndex]].classList.add('selected');
                document.getElementById('nextBtn').disabled = false;
            }
        }
    }

    // Finish the exam
    finishExam() {
        // Calculate score
        let correctAnswers = 0;
        this.currentExam.questions.forEach((question, index) => {
            if (this.examAnswers[index] === question.correct) {
                correctAnswers++;
            }
        });
        
        const score = Math.round((correctAnswers / this.currentExam.questions.length) * 100);
        const timeTaken = Math.round((Date.now() - this.examStartTime) / 1000);
        
        // Update lesson
        const subject = stemSubjects[this.currentExam.subjectKey];
        const lesson = subject.lessons.find(l => l.id === this.currentExam.lessonId);
        if (lesson) {
            lesson.examCompleted = true;
        }
        
        // Update user points
        const pointsEarned = Math.round(score / 10) * 5; // 5 points per 10% score
        currentUser.totalPoints = (currentUser.totalPoints || 0) + pointsEarned;
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Close exam modal
        this.closeExamModal();
        
        // Show result modal
        this.showResultModal(score, correctAnswers, this.currentExam.questions.length, pointsEarned, timeTaken);
        
        // Show celebration for good scores
        if (score >= 70) {
            this.showCelebration();
        }
    }

    // Show result modal
    showResultModal(score, correct, total, pointsEarned, timeTaken) {
        const modal = document.getElementById('resultModal');
        if (!modal) {
            this.createResultModal();
        }
        
        const container = document.getElementById('resultContainer');
        
        let iconClass = 'poor';
        let message = 'Keep practicing!';
        let icon = 'fa-redo';
        
        if (score >= 90) {
            iconClass = 'excellent';
            message = 'Excellent work!';
            icon = 'fa-trophy';
        } else if (score >= 80) {
            iconClass = 'good';
            message = 'Great job!';
            icon = 'fa-medal';
        } else if (score >= 70) {
            iconClass = 'average';
            message = 'Good effort!';
            icon = 'fa-star';
        }
        
        container.innerHTML = `
            <div class="result-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="result-score">${score}%</div>
            <div class="result-message">${message}</div>
            <div class="result-details">
                <div class="result-detail">
                    <h4>Correct Answers</h4>
                    <p>${correct}/${total}</p>
                </div>
                <div class="result-detail">
                    <h4>Points Earned</h4>
                    <p>+${pointsEarned}</p>
                </div>
                <div class="result-detail">
                    <h4>Time Taken</h4>
                    <p>${timeTaken}s</p>
                </div>
            </div>
            <button class="btn btn-primary" onclick="examSystem.closeResultModal()">
                <i class="fas fa-check"></i>
                Continue Learning
            </button>
        `;
        
        document.getElementById('resultModal').style.display = 'flex';
    }

    // Create result modal if it doesn't exist
    createResultModal() {
        const modalHTML = `
            <div class="modal-overlay" id="resultModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Exam Results</h3>
                        <button class="modal-close" onclick="examSystem.closeResultModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="result-container" id="resultContainer">
                            <!-- Result content will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Show celebration animation
    showCelebration() {
        const thumbsUpCount = 15;
        
        for (let i = 0; i < thumbsUpCount; i++) {
            setTimeout(() => {
                const thumbsUp = document.createElement('div');
                thumbsUp.className = 'thumbs-up';
                thumbsUp.innerHTML = '👍';
                thumbsUp.style.cssText = `
                    position: absolute;
                    font-size: 2rem;
                    animation: fall 3s linear infinite;
                    left: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 2}s;
                `;
                
                this.celebrationContainer.appendChild(thumbsUp);
                
                setTimeout(() => {
                    if (thumbsUp.parentNode) {
                        thumbsUp.parentNode.removeChild(thumbsUp);
                    }
                }, 3000);
            }, i * 200);
        }
    }

    // Close exam modal
    closeExamModal() {
        document.getElementById('examModal').style.display = 'none';
    }

    // Close result modal
    closeResultModal() {
        document.getElementById('resultModal').style.display = 'none';
        updateUserInterface();
        loadSubjects();
    }
}

// Create global exam system instance
window.examSystem = new ExamSystem();

// Add CSS for exam system
const examCSS = `
    /* Exam Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }

    .modal {
        background: var(--card-bg);
        border-radius: 20px;
        padding: 2rem;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-light);
    }

    .modal-close {
        background: none;
        border: none;
        color: var(--text-gray);
        font-size: 1.5rem;
        cursor: pointer;
        transition: color 0.3s ease;
    }

    .modal-close:hover {
        color: var(--text-light);
    }

    .question-container {
        margin-bottom: 2rem;
    }

    .question {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--text-light);
    }

    .options {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .option {
        padding: 1rem;
        background: var(--dark-bg);
        border: 2px solid var(--border-color);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .option:hover {
        border-color: var(--primary-color);
        background: rgba(59, 130, 246, 0.1);
    }

    .option.selected {
        border-color: var(--primary-color);
        background: rgba(59, 130, 246, 0.2);
    }

    .option.correct {
        border-color: var(--secondary-color);
        background: rgba(16, 185, 129, 0.2);
    }

    .option.incorrect {
        border-color: var(--danger-color);
        background: rgba(239, 68, 68, 0.2);
    }

    .option-letter {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        color: var(--text-light);
    }

    .option.selected .option-letter {
        background: var(--primary-color);
    }

    .option.correct .option-letter {
        background: var(--secondary-color);
    }

    .option.incorrect .option-letter {
        background: var(--danger-color);
    }

    .exam-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    .exam-progress {
        color: var(--text-gray);
        font-size: 0.9rem;
    }

    .exam-buttons {
        display: flex;
        gap: 1rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
    }

    .btn-primary:hover {
        background: #2563EB;
    }

    .btn-secondary {
        background: var(--secondary-color);
        color: white;
    }

    .btn-secondary:hover {
        background: #059669;
    }

    .btn:disabled {
        background: var(--text-gray);
        cursor: not-allowed;
    }

    /* Result Modal Styles */
    .result-container {
        text-align: center;
        padding: 2rem;
    }

    .result-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1rem;
    }

    .result-icon.excellent {
        background: var(--secondary-color);
        color: white;
    }

    .result-icon.good {
        background: var(--primary-color);
        color: white;
    }

    .result-icon.average {
        background: var(--accent-color);
        color: white;
    }

    .result-icon.poor {
        background: var(--danger-color);
        color: white;
    }

    .result-score {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 1rem;
        background: var(--gradient-1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .result-message {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        color: var(--text-light);
    }

    .result-details {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .result-detail {
        background: var(--dark-bg);
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid var(--border-color);
    }

    .result-detail h4 {
        font-size: 0.9rem;
        color: var(--text-gray);
        margin-bottom: 0.5rem;
    }

    .result-detail p {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-light);
    }

    /* Celebration Animation */
    .celebration {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    }

    .thumbs-up {
        position: absolute;
        font-size: 2rem;
        animation: fall 3s linear infinite;
    }

    @keyframes fall {
        0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .result-details {
            grid-template-columns: 1fr;
        }
        
        .exam-navigation {
            flex-direction: column;
            gap: 1rem;
        }
        
        .exam-buttons {
            width: 100%;
            justify-content: space-between;
        }
    }
`;

// Add CSS to document
const style = document.createElement('style');
style.textContent = examCSS;
document.head.appendChild(style);
