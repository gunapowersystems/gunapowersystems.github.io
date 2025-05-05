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
        const submitPasswordButton = document.getElementById('submit-password');
        const adminPasswordInput = document.getElementById('admin-password');
        const adminPasswordModal = document.getElementById('adminPasswordModal');
        
        submitPasswordButton.addEventListener('click', function() {
            const passwordInput = adminPasswordInput.value;
            if (passwordInput === adminPassword) {
                // Hide modal before redirecting
                $('#adminPasswordModal').modal('hide');
                window.location.href = 'admin.html';
            } else {
                alert('Incorrect password. Please try again.');
            }
            // Clear password field for security
            adminPasswordInput.value = '';
        });

        // Also handle form submission on Enter key
        document.getElementById('admin-password-form').addEventListener('submit', function(e) {
            e.preventDefault();
            submitPasswordButton.click();
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

    // Handle question type selection and multiple choice options
    const questionTypeInputs = document.querySelectorAll('input[name="question-type"]');
    const multipleChoiceOptions = document.getElementById('multiple-choice-options');
    const addOptionButton = document.getElementById('add-option');
    const optionsContainer = document.getElementById('options-container');

    if (questionTypeInputs.length > 0) {
        questionTypeInputs.forEach(input => {
            input.addEventListener('change', function() {
                multipleChoiceOptions.style.display = 
                    this.value === 'multiple' ? 'block' : 'none';
            });
        });
    }

    if (addOptionButton) {
        addOptionButton.addEventListener('click', function() {
            const optionCount = optionsContainer.children.length;
            const newOption = document.createElement('div');
            newOption.className = 'input-group mb-2';
            newOption.innerHTML = `
                <input type="text" class="form-control option-input" placeholder="Option ${optionCount + 1}">
                <div class="input-group-append">
                    <div class="input-group-text">
                        <input type="radio" name="correct-option" value="${optionCount}" aria-label="Correct answer">
                    </div>
                </div>
            `;
            optionsContainer.appendChild(newOption);
        });
    }

    // Handle posting questions (Admin page)
    if (postButton) {
        postButton.addEventListener('click', async function() {
            const questionInput = document.getElementById('question');
            const question = questionInput.value.trim();
            const questionType = document.querySelector('input[name="question-type"]:checked').value;
            
            if (!question) {
                alert('Please enter a question first.');
                return;
            }

            try {
                // Get a reference to the questions list in Firebase
                const questionsRef = ref(database, 'questions');
                
                // Create a new question object
                const newQuestion = {
                    text: question,
                    type: questionType,
                    timestamp: Date.now()
                };

                // If it's a multiple choice question, add the options
                if (questionType === 'multiple') {
                    const options = [];
                    const optionInputs = document.querySelectorAll('.option-input');
                    const correctOption = document.querySelector('input[name="correct-option"]:checked');

                    if (!correctOption) {
                        alert('Please select the correct answer for your multiple choice question.');
                        return;
                    }

                    optionInputs.forEach((input, index) => {
                        if (input.value.trim()) {
                            options.push({
                                text: input.value.trim(),
                                isCorrect: index === parseInt(correctOption.value)
                            });
                        }
                    });

                    if (options.length < 2) {
                        alert('Please add at least two options for multiple choice questions.');
                        return;
                    }

                    newQuestion.options = options;
                }

                // Push the new question and get the generated key
                const newQuestionRef = await push(questionsRef);
                
                // Set the data at the generated location
                await set(newQuestionRef, newQuestion);
                
                console.log('Question posted successfully:', newQuestion);
                alert('Question posted successfully!');
                
                // Clear form
                questionInput.value = '';
                if (questionType === 'multiple') {
                    optionsContainer.innerHTML = `
                        <div class="input-group mb-2">
                            <input type="text" class="form-control option-input" placeholder="Option 1">
                            <div class="input-group-append">
                                <div class="input-group-text">
                                    <input type="radio" name="correct-option" value="0" aria-label="Correct answer">
                                </div>
                            </div>
                        </div>
                        <div class="input-group mb-2">
                            <input type="text" class="form-control option-input" placeholder="Option 2">
                            <div class="input-group-append">
                                <div class="input-group-text">
                                    <input type="radio" name="correct-option" value="1" aria-label="Correct answer">
                                </div>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error posting question:', error);
                alert('Error posting question: ' + error.message);
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
                
                // Create the answers section based on question type
                let answerFormHtml = '';
                if (question.type === 'multiple') {
                    answerFormHtml = `
                        <div class="answer-form">
                            <div class="form-group">
                                <div class="options-list">
                                    ${question.options.map((option, optIndex) => `
                                        <div class="custom-control custom-radio mb-2">
                                            <input type="radio" 
                                                id="option-${question.key}-${optIndex}" 
                                                name="answer-${question.key}" 
                                                class="custom-control-input answer-option" 
                                                value="${optIndex}">
                                            <label class="custom-control-label" for="option-${question.key}-${optIndex}">
                                                ${option.text}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="btn btn-primary submit-answer mt-2" data-question-id="${question.key}">Submit Answer</button>
                            </div>
                        </div>
                    `;
                } else {
                    answerFormHtml = `
                        <div class="answer-form">
                            <div class="form-group">
                                <textarea class="form-control answer-input" rows="2" placeholder="Type your answer here..."></textarea>
                            </div>
                            <button class="btn btn-primary submit-answer" data-question-id="${question.key}">Submit Answer</button>
                        </div>
                    `;
                }

                // Create the user's answer display section
                let userAnswerHtml = '<p class="text-muted">You haven\'t answered this question yet</p>';
                if (question.answers) {
                    const userAnswers = Object.entries(question.answers)
                        .filter(([_, answer]) => answer.userName === currentUserName)
                        .map(([_, answer]) => {
                            let answerText = answer.text;
                            if (question.type === 'multiple') {
                                const selectedOption = question.options[parseInt(answer.text)];
                                answerText = selectedOption.text;
                            }
                            return `
                                <div class="answer-item mb-2">
                                    <div class="alert alert-info">
                                        <strong>Your Answer:</strong> ${answerText}
                                        <small class="text-muted d-block">Answered: ${new Date(answer.timestamp).toLocaleString()}</small>
                                    </div>
                                </div>
                            `;
                        });
                    
                    if (userAnswers.length > 0) {
                        userAnswerHtml = userAnswers.join('');
                    }
                }

                questionElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Question ${index + 1}</h5>
                        <p class="card-text">${question.text}</p>
                        <small class="text-muted d-block mb-3">Posted: ${new Date(question.timestamp).toLocaleString()}</small>
                        
                        <div class="answers-section mb-3">
                            <h6>Your Answer:</h6>
                            <div class="answers-list">
                                ${userAnswerHtml}
                            </div>
                        </div>

                        ${answerFormHtml}
                    </div>
                `;

                // Add event listener for submit answer button
                const submitButton = questionElement.querySelector('.submit-answer');
                submitButton.addEventListener('click', async () => {
                    let answerText;
                    if (question.type === 'multiple') {
                        const selectedOption = questionElement.querySelector(`input[name="answer-${question.key}"]:checked`);
                        if (!selectedOption) {
                            alert('Please select an answer');
                            return;
                        }
                        answerText = selectedOption.value;
                    } else {
                        const answerInput = questionElement.querySelector('.answer-input');
                        answerText = answerInput.value.trim();
                        if (!answerText) {
                            alert('Please enter an answer first');
                            return;
                        }
                    }

                    try {
                        const answersRef = ref(database, `questions/${question.key}/answers`);
                        const newAnswer = {
                            text: answerText,
                            userName: currentUserName,
                            timestamp: Date.now()
                        };
                        await push(answersRef, newAnswer);
                        if (question.type !== 'multiple') {
                            questionElement.querySelector('.answer-input').value = '';
                        }
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
                        
                        // Format the answer text based on question type
                        let displayAnswer = answer.text;
                        if (question.type === 'multiple') {
                            const selectedOption = question.options[parseInt(answer.text)];
                            const isCorrect = selectedOption.isCorrect;
                            displayAnswer = `
                                ${selectedOption.text}
                                ${isCorrect ? 
                                    '<span class="badge badge-success ml-2">Correct</span>' : 
                                    '<span class="badge badge-danger ml-2">Incorrect</span>'}
                            `;
                        }
                        
                        answersByUser[answer.userName].push({
                            ...answer,
                            id: answerId,
                            displayText: displayAnswer
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
                                                    <div class="text-dark">${ans.displayText}</div>
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