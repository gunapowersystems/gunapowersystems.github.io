document.addEventListener('DOMContentLoaded', function() {
    const submitBtn = document.getElementById('submit');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    // Add validation to required fields
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            if (this.value.trim() === '') {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    });

    // Add file input change handlers
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function() {
            const fileCount = this.files.length;
            const fileChosenSpan = this.parentElement.querySelector('.file-chosen');
            if (fileCount > 0) {
                fileChosenSpan.textContent = fileCount === 1 
                    ? this.files[0].name 
                    : `${fileCount} files selected`;
            } else {
                fileChosenSpan.textContent = '';
            }
        });
    });
});

function handleSubmit(e) {
    e.preventDefault();
    
    // Collect all answers
    const answers = {
        sectionA: {},
        sectionB: {},
        sectionC: {}
    };

    // Collect MCQ answers
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        answers.sectionA[radio.name] = radio.value;
    });

    // Collect short answers
    document.querySelectorAll('#section-b textarea').forEach(textarea => {
        answers.sectionB[textarea.name] = textarea.value;
    });

    // Collect programming answers
    document.querySelectorAll('#section-c textarea').forEach(textarea => {
        answers.sectionC[textarea.name] = textarea.value;
    });

    // Validate that all questions are answered
    const totalQuestions = {
        sectionA: 10,
        sectionB: 5,
        sectionC: 2
    };

    let isValid = true;
    let message = '';

    // Check Section A (MCQs)
    if (Object.keys(answers.sectionA).length < totalQuestions.sectionA) {
        message += 'Please answer all multiple choice questions.\n';
        isValid = false;
    }

    // Check Section B (Short Answers)
    const shortAnswers = Object.values(answers.sectionB).filter(answer => answer.trim() !== '');
    if (shortAnswers.length < totalQuestions.sectionB) {
        message += 'Please answer all short answer questions.\n';
        isValid = false;
    }

    // Check Section C (Programming)
    const programmingAnswers = Object.values(answers.sectionC).filter(answer => answer.trim() !== '');
    if (programmingAnswers.length < totalQuestions.sectionC) {
        message += 'Please answer all programming questions.\n';
        isValid = false;
    }

    if (!isValid) {
        alert(message);
        return;
    }

    // If everything is valid, show confirmation and store answers
    if (confirm('Are you sure you want to submit your answers?')) {
        localStorage.setItem('quizAnswers', JSON.stringify(answers));
        alert('Your answers have been submitted successfully!');
        // Here you could add code to send answers to a server
    }
}