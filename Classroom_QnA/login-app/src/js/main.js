import { database, ref, push, onValue, set } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginButton = document.getElementById('admin-login');
    const userLoginButton = document.getElementById('user-login');
    const postButton = document.getElementById('post-button');
    const questionsContainer = document.getElementById('questions-container');
    const adminPassword = 'letmein';

    // Handle main page login buttons
    if (adminLoginButton && userLoginButton) {
        adminLoginButton.addEventListener('click', function() {
            const passwordInput = prompt('Enter Admin Password:');
            if (passwordInput === adminPassword) {
                window.location.href = 'admin.html';
            } else {
                alert('Incorrect password. Please try again.');
            }
        });

        userLoginButton.addEventListener('click', function() {
            window.location.href = 'user.html';
        });
    }

    // Handle posting questions (Admin page)
    if (postButton) {
        postButton.addEventListener('click', async function() {
            const questionInput = document.getElementById('question');
            const question = questionInput.value.trim();
            
            if (question) {
                try {
                    // Get a reference to the questions list in Firebase
                    const questionsRef = ref(database, 'questions');
                    
                    // Create a new question object
                    const newQuestion = {
                        text: question,
                        timestamp: Date.now()
                    };

                    // Push the new question and get the generated key
                    const newQuestionRef = await push(questionsRef);
                    
                    // Set the data at the generated location
                    await set(newQuestionRef, newQuestion);
                    
                    console.log('Question posted successfully:', newQuestion);
                    alert('Question posted successfully!');
                    questionInput.value = '';
                } catch (error) {
                    console.error('Error posting question:', error);
                    alert('Error posting question: ' + error.message);
                }
            } else {
                alert('Please enter a question first.');
            }
        });
    }

    // Handle displaying questions (User page)
    if (questionsContainer) {
        // Reference to questions in Firebase
        const questionsRef = ref(database, 'questions');
        
        // Listen for changes in the questions data
        onValue(questionsRef, (snapshot) => {
            questionsContainer.innerHTML = '';
            const questions = snapshot.val();
            
            if (!questions) {
                questionsContainer.innerHTML = '<p class="alert alert-info">No questions posted yet.</p>';
                return;
            }

            // Convert the object to an array and sort by timestamp
            const questionList = Object.entries(questions)
                .map(([key, value]) => ({ ...value, key }))
                .sort((a, b) => b.timestamp - a.timestamp);

            // Display each question
            questionList.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'card mb-3';
                questionElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Question ${index + 1}</h5>
                        <p class="card-text">${question.text}</p>
                        <small class="text-muted">Posted: ${new Date(question.timestamp).toLocaleString()}</small>
                    </div>
                `;
                questionsContainer.appendChild(questionElement);
            });
        }, (error) => {
            questionsContainer.innerHTML = '<p class="alert alert-danger">Error loading questions: ' + error.message + '</p>';
        });
    }
});