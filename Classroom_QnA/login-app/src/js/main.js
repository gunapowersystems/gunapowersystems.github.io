import { database, ref, push, onValue, set, onDisconnect } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    const adminLoginButton = document.getElementById('admin-login');
    const userLoginButton = document.getElementById('user-login');
    const postButton = document.getElementById('post-button');
    const questionsContainer = document.getElementById('questions-container');
    const nameForm = document.getElementById('name-form');
    const contentDiv = document.getElementById('content');
    const joinButton = document.getElementById('join-button');
    const attendeesList = document.getElementById('attendees-list');
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

    // Handle user name submission and presence
    if (joinButton) {
        joinButton.addEventListener('click', async function() {
            const nameInput = document.getElementById('user-name');
            const userName = nameInput.value.trim();
            
            if (userName) {
                // Create a unique ID for this user session
                const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                const userRef = ref(database, `attendees/${userId}`);
                
                // Set up presence handling
                await set(userRef, {
                    name: userName,
                    lastSeen: Date.now()
                });

                // Remove user data when they disconnect
                onDisconnect(userRef).remove();

                // Update lastSeen every 30 seconds while connected
                setInterval(() => {
                    set(userRef, {
                        name: userName,
                        lastSeen: Date.now()
                    });
                }, 30000);

                // Show the content
                nameForm.style.display = 'none';
                contentDiv.style.display = 'block';
            } else {
                alert('Please enter your name');
            }
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

    // Handle displaying attendees list (Admin page)
    if (attendeesList) {
        console.log('Initializing attendees list listener');
        const attendeesRef = ref(database, 'attendees');
        
        onValue(attendeesRef, (snapshot) => {
            console.log('Received attendees update:', snapshot.val());
            attendeesList.innerHTML = '';
            const attendees = snapshot.val();
            
            if (!attendees) {
                attendeesList.innerHTML = '<li class="list-group-item">No attendees yet</li>';
                return;
            }

            let activeCount = 0;
            const currentTime = Date.now();
            const activeTimeout = 60000; // 1 minute

            Object.entries(attendees).forEach(([id, data]) => {
                console.log('Processing attendee:', id, data);
                if (currentTime - data.lastSeen <= activeTimeout) {
                    activeCount++;
                    const attendeeItem = document.createElement('li');
                    attendeeItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                    attendeeItem.innerHTML = `
                        ${data.name}
                        <span class="badge badge-success badge-pill">Active</span>
                    `;
                    attendeesList.appendChild(attendeeItem);
                } else {
                    console.log('Removing inactive user:', id);
                    const inactiveRef = ref(database, `attendees/${id}`);
                    set(inactiveRef, null);
                }
            });

            if (activeCount === 0) {
                attendeesList.innerHTML = '<li class="list-group-item">No active attendees</li>';
            }
        }, (error) => {
            console.error('Error loading attendees:', error);
            attendeesList.innerHTML = '<li class="list-group-item text-danger">Error loading attendees</li>';
        });
    }

    // Handle displaying questions with answer functionality (User page)
    if (questionsContainer) {
        let currentUserName = ''; // Will be set when user joins
        
        // Listen for changes in the questions data
        const questionsRef = ref(database, 'questions');
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
                .sort((a, b) => a.timestamp - b.timestamp);

            // Display each question with answer section
            questionList.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'card mb-3';
                
                // Create the answers section
                const answersHtml = question.answers ? 
                    Object.entries(question.answers)
                        .map(([userId, answer]) => `
                            <div class="answer-item mb-2">
                                <strong>${answer.userName}:</strong> ${answer.text}
                                <small class="text-muted d-block">Answered: ${new Date(answer.timestamp).toLocaleString()}</small>
                            </div>
                        `).join('') : '';

                questionElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Question ${index + 1}</h5>
                        <p class="card-text">${question.text}</p>
                        <small class="text-muted d-block mb-3">Posted: ${new Date(question.timestamp).toLocaleString()}</small>
                        
                        <div class="answers-section mb-3">
                            <h6>Answers:</h6>
                            <div class="answers-list">
                                ${answersHtml || '<p class="text-muted">No answers yet</p>'}
                            </div>
                        </div>

                        <div class="answer-form">
                            <div class="form-group">
                                <textarea class="form-control answer-input" rows="2" placeholder="Type your answer here..."></textarea>
                            </div>
                            <button class="btn btn-primary submit-answer" data-question-id="${question.key}">Submit Answer</button>
                        </div>
                    </div>
                `;

                // Add event listener for submit answer button
                const submitButton = questionElement.querySelector('.submit-answer');
                const answerInput = questionElement.querySelector('.answer-input');

                submitButton.addEventListener('click', async () => {
                    const answerText = answerInput.value.trim();
                    if (!answerText) {
                        alert('Please enter an answer first');
                        return;
                    }

                    try {
                        const answersRef = ref(database, `questions/${question.key}/answers`);
                        const newAnswer = {
                            text: answerText,
                            userName: currentUserName,
                            timestamp: Date.now()
                        };
                        await push(answersRef, newAnswer);
                        answerInput.value = '';
                    } catch (error) {
                        console.error('Error submitting answer:', error);
                        alert('Error submitting answer: ' + error.message);
                    }
                });

                questionsContainer.appendChild(questionElement);
            });
        });

        // Store username when user joins
        if (joinButton) {
            const originalJoinButtonClick = joinButton.onclick;
            joinButton.onclick = async function(e) {
                const nameInput = document.getElementById('user-name');
                currentUserName = nameInput.value.trim();
                if (originalJoinButtonClick) {
                    originalJoinButtonClick.call(this, e);
                }
            };
        }
    }

    // Handle displaying questions and answers (Admin page)
    const questionsAnswersContainer = document.getElementById('questions-answers-container');
    if (questionsAnswersContainer) {
        const questionsRef = ref(database, 'questions');
        onValue(questionsRef, (snapshot) => {
            questionsAnswersContainer.innerHTML = '';
            const questions = snapshot.val();
            
            if (!questions) {
                questionsAnswersContainer.innerHTML = '<p class="alert alert-info">No questions posted yet.</p>';
                return;
            }

            const questionList = Object.entries(questions)
                .map(([key, value]) => ({ ...value, key }))
                .sort((a, b) => a.timestamp - b.timestamp);

            questionList.forEach((question, index) => {
                const questionElement = document.createElement('div');
                questionElement.className = 'card mb-4';
                
                // Create the answers section with collapsible elements
                let answersHtml = '';
                if (question.answers) {
                    // Group answers by user
                    const answersByUser = {};
                    Object.entries(question.answers).forEach(([answerId, answer]) => {
                        if (!answersByUser[answer.userName]) {
                            answersByUser[answer.userName] = [];
                        }
                        answersByUser[answer.userName].push({
                            ...answer,
                            id: answerId
                        });
                    });

                    // Create collapsible sections for each user's answers
                    answersHtml = Object.entries(answersByUser)
                        .map(([userName, userAnswers]) => {
                            const latestAnswer = userAnswers[userAnswers.length - 1];
                            const answerId = `answer-${question.key}-${latestAnswer.id}`;
                            return `
                                <div class="user-answer mb-2">
                                    <button class="btn btn-link p-0 text-left text-primary" 
                                            data-toggle="collapse" 
                                            data-target="#${answerId}" 
                                            aria-expanded="false">
                                        ${userName}
                                    </button>
                                    <div id="${answerId}" class="collapse">
                                        <div class="pl-3 pt-2">
                                            ${userAnswers.map(ans => `
                                                <div class="answer-content mb-2">
                                                    <div class="text-dark">${ans.text}</div>
                                                    <small class="text-muted">Answered: ${new Date(ans.timestamp).toLocaleString()}</small>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                }

                questionElement.innerHTML = `
                    <div class="card-header">
                        <h5 class="mb-0">Question ${index + 1}</h5>
                        <small class="text-muted">Posted: ${new Date(question.timestamp).toLocaleString()}</small>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${question.text}</p>
                        
                        <div class="answers-section mt-3">
                            <h6>Answers:</h6>
                            <div class="answers-list">
                                ${answersHtml || '<p class="text-muted">No answers yet</p>'}
                            </div>
                        </div>
                    </div>
                `;

                questionsAnswersContainer.appendChild(questionElement);
            });
        }, {
            serverTimeOffset: 0
        });
    }
});