document.addEventListener('DOMContentLoaded', function() {
    // Update current date
    const currentDate = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', options);

    // Wait for sections to load before initializing form handlers
    document.body.addEventListener('htmx:afterSettle', function() {
        setupFormHandlers();
    });
});

function setupFormHandlers() {
    const form = document.getElementById('quiz-form');
    
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Add validation to required fields
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            if (this.value.trim() === '') {
                this.classList.add('is-invalid');
                this.parentElement.classList.add('needs-feedback');
            } else {
                this.classList.remove('is-invalid');
                this.parentElement.classList.remove('needs-feedback');
            }
        });
    });

    // Add file input change handlers
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
            const fileCount = this.files.length;
            const fileChosenSpan = this.parentElement.querySelector('.file-chosen');
            const label = this.parentElement.querySelector('.file-label');
            
            if (fileCount > 0) {
                label.classList.add('has-files');
                fileChosenSpan.textContent = fileCount === 1 
                    ? `${this.files[0].name}`
                    : `${fileCount} files selected`;
                fileChosenSpan.classList.add('show');
            } else {
                label.classList.remove('has-files');
                fileChosenSpan.textContent = '';
                fileChosenSpan.classList.remove('show');
            }
        });
    });
}

async function handleSubmit(e) {
    e.preventDefault();
    
    try {
        showToast('Submitting your answers...', 'info');

        // Get Firebase database reference
        const { ref, set } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
        const database = window.firebaseDB;

        // Generate a unique submission ID
        const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Collect MCQ answers (section A)
        const sectionAAnswers = {};
        const sectionA = document.getElementById('section-a');
        sectionA.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            sectionAAnswers[radio.name] = radio.value;
        });

        console.log('Section A Answers:', sectionAAnswers); // Debug log

        // Collect short answers (section B)
        const sectionBAnswers = {};
        document.querySelectorAll('#section-b textarea').forEach(textarea => {
            if (textarea.value.trim()) {
                sectionBAnswers[textarea.name] = textarea.value.trim();
            }
        });

        // Collect programming answers (section C)
        const sectionCAnswers = {};
        document.querySelectorAll('#section-c textarea').forEach(textarea => {
            if (textarea.value.trim()) {
                sectionCAnswers[textarea.name] = textarea.value.trim();
            }
        });

        // Create submission data
        const submissionData = {
            timestamp: new Date().toISOString(),
            studentId: "test-student", // You can add actual student ID later
            answers: {
                sectionA: sectionAAnswers,
                sectionB: sectionBAnswers,
                sectionC: sectionCAnswers
            }
        };

        // Save to Firebase
        const submissionRef = ref(database, `submissions/${submissionId}`);
        await set(submissionRef, submissionData);

        console.log('Submission successful:', submissionId); // Debug log
        showToast('Your answers have been submitted successfully!', 'success');
        
        // Disable form after submission
        document.querySelector('.quiz-container').classList.add('submitted');
        
    } catch (error) {
        console.error('Submission error:', error);
        showToast('Failed to submit answers. Please try again.', 'error');
    }
}

// Toast notification function remains unchanged
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    document.querySelector('.toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}