document.addEventListener('DOMContentLoaded', function() {
    // Update current date
    const currentDate = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', options);

    const submitBtn = document.getElementById('submit');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmit);
    }

    // Add validation and modern feedback to required fields
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

    // Add file input change handlers with modern feedback
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

    // Add smooth scroll when navigating between sections
    document.querySelectorAll('.section').forEach(section => {
        section.addEventListener('click', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    // Collect short answers and files
    document.querySelectorAll('#section-b textarea').forEach(textarea => {
        answers.sectionB[textarea.name] = {
            text: textarea.value,
            files: Array.from(document.querySelector(`input[name="files-${textarea.name}"]`)?.files || [])
                .map(file => file.name)
        };
    });

    // Collect programming answers and files
    document.querySelectorAll('#section-c textarea').forEach(textarea => {
        answers.sectionC[textarea.name] = {
            code: textarea.value,
            files: Array.from(document.querySelector(`input[name="files-${textarea.name}"]`)?.files || [])
                .map(file => file.name)
        };
    });

    // Validate answers with modern feedback
    const totalQuestions = {
        sectionA: 10,
        sectionB: 5,
        sectionC: 2
    };

    let isValid = true;
    let invalidSections = [];

    // Check Section A (MCQs)
    if (Object.keys(answers.sectionA).length < totalQuestions.sectionA) {
        invalidSections.push('Multiple Choice Questions');
        isValid = false;
        document.querySelector('section-a').classList.add('section-invalid');
    } else {
        document.querySelector('section-a').classList.remove('section-invalid');
    }

    // Check Section B (Short Answers)
    const shortAnswers = Object.values(answers.sectionB).filter(answer => answer.text.trim() !== '');
    if (shortAnswers.length < totalQuestions.sectionB) {
        invalidSections.push('Short Answer Questions');
        isValid = false;
        document.querySelector('section-b').classList.add('section-invalid');
    } else {
        document.querySelector('section-b').classList.remove('section-invalid');
    }

    // Check Section C (Programming)
    const programmingAnswers = Object.values(answers.sectionC).filter(answer => answer.code.trim() !== '');
    if (programmingAnswers.length < totalQuestions.sectionC) {
        invalidSections.push('Programming Questions');
        isValid = false;
        document.querySelector('section-c').classList.add('section-invalid');
    } else {
        document.querySelector('section-c').classList.remove('section-invalid');
    }

    if (!isValid) {
        showToast(`Please complete all questions in: ${invalidSections.join(', ')}`, 'error');
        return;
    }

    // If everything is valid, show confirmation and store answers
    if (confirm('Are you sure you want to submit your answers?')) {
        localStorage.setItem('quizAnswers', JSON.stringify(answers));
        showToast('Your answers have been submitted successfully!', 'success');
        document.querySelector('.quiz-container').classList.add('submitted');
    }
}

// Modern toast notification
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