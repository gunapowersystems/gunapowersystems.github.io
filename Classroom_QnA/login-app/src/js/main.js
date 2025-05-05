document.addEventListener('DOMContentLoaded', function() {
    const adminLoginButton = document.getElementById('admin-login');
    const userLoginButton = document.getElementById('user-login');
    const postButton = document.getElementById('post-button');
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

    // Handle posting questions
    if (postButton) {
        postButton.addEventListener('click', function() {
            const questionInput = document.getElementById('question');
            const question = questionInput.value.trim();
            
            if (question) {
                const questions = JSON.parse(localStorage.getItem('questions') || '[]');
                questions.push(question);
                localStorage.setItem('questions', JSON.stringify(questions));
                
                alert('Question posted successfully!');
                questionInput.value = '';
            } else {
                alert('Please enter a question first.');
            }
        });
    }
});