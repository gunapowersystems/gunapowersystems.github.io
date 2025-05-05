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