document.addEventListener('DOMContentLoaded', async function() {
    // Update current date
    const currentDate = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', options);

    // Load previous submission from Firebase only once when page loads
    await loadInitialSubmission();

    // Setup form submit handler directly
    const form = document.getElementById('quiz-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Wait for sections to load before initializing other handlers
    document.body.addEventListener('htmx:afterSettle', function() {
        setupInputHandlers();
    });
});

async function loadInitialSubmission() {
    try {
        const { ref, get } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
        const database = window.firebaseDB;
        
        const submissionRef = ref(database, 'current-submission');
        const snapshot = await get(submissionRef);
        
        if (snapshot.exists()) {
            const submissionData = snapshot.val();
            await loadPreviousAnswers(submissionData);
            showToast('Previous answers loaded successfully', 'success');
        }
    } catch (error) {
        console.error('Error loading previous submission:', error);
        showToast('Failed to load previous answers', 'error');
    }
}

function setupInputHandlers() {
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
        showToast('Saving your answers...', 'info');

        // Handle files first
        await handleFileUploads();

        // Get Firebase database reference
        const { ref, set } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js');
        const database = window.firebaseDB;

        // Collect MCQ answers (section A)
        const sectionAAnswers = {};
        const sectionA = document.getElementById('section-a');
        sectionA.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            sectionAAnswers[radio.name] = radio.value;
        });

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
            lastUpdated: new Date().toISOString(),
            studentId: "test-student", // You can add actual student ID later
            answers: {
                sectionA: sectionAAnswers,
                sectionB: sectionBAnswers,
                sectionC: sectionCAnswers
            }
        };

        // Use a fixed path for the submission instead of generating a new ID
        const submissionRef = ref(database, 'current-submission');
        await set(submissionRef, submissionData);

        console.log('Answers saved successfully');
        showToast('Your answers have been saved. You can continue making changes if needed.', 'success');
        
    } catch (error) {
        console.error('Submission error:', error);
        showToast('Failed to save answers. Please try again.', 'error');
    }
}

async function handleFileUploads() {
    const { collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');
    const firestore = window.firestoreDB;
    
    // Get all file inputs
    const fileInputs = document.querySelectorAll('.file-input');
    const filePromises = [];

    for (const input of fileInputs) {
        if (input.files.length > 0) {
            const files = Array.from(input.files);
            const questionId = input.name; // e.g., "files-q11"

            // Process each file for this question
            for (const file of files) {
                const filePromise = new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        try {
                            // Store file in Firestore
                            const fileDoc = doc(collection(firestore, 'submissions', 'current-submission', 'files'));
                            await setDoc(fileDoc, {
                                questionId: questionId,
                                fileName: file.name,
                                fileType: file.type,
                                fileSize: file.size,
                                content: reader.result,
                                timestamp: new Date().toISOString()
                            });
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });
                filePromises.push(filePromise);
            }
        }
    }

    if (filePromises.length > 0) {
        await Promise.all(filePromises);
        console.log('Files saved successfully');
    }
}

async function loadPreviousAnswers(submissionData) {
    // Wait for sections to be loaded by HTMX
    await new Promise(resolve => {
        const checkSections = () => {
            if (document.getElementById('section-a').children.length > 0) {
                resolve();
            } else {
                setTimeout(checkSections, 100);
            }
        };
        checkSections();
    });

    // Load Section A (MCQ) answers
    if (submissionData.answers.sectionA) {
        Object.entries(submissionData.answers.sectionA).forEach(([name, value]) => {
            const radio = document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
            }
        });
    }

    // Load Section B answers
    if (submissionData.answers.sectionB) {
        Object.entries(submissionData.answers.sectionB).forEach(([name, value]) => {
            const textarea = document.querySelector(`#section-b textarea[name="${name}"]`);
            if (textarea) {
                textarea.value = value;
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        });
    }

    // Load Section C answers
    if (submissionData.answers.sectionC) {
        Object.entries(submissionData.answers.sectionC).forEach(([name, value]) => {
            const textarea = document.querySelector(`#section-c textarea[name="${name}"]`);
            if (textarea) {
                textarea.value = value;
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        });
    }

    // Load previously uploaded files information
    await loadPreviousFiles();
}

async function loadPreviousFiles() {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js');
        const firestore = window.firestoreDB;

        const filesSnapshot = await getDocs(collection(firestore, 'submissions', 'current-submission', 'files'));
        
        // Clear existing file labels
        document.querySelectorAll('.file-chosen').forEach(span => {
            span.textContent = '';
            span.classList.remove('show');
        });
        document.querySelectorAll('.file-label').forEach(label => {
            label.classList.remove('has-files');
        });

        // Group files by questionId
        const filesByQuestion = {};
        filesSnapshot.forEach(doc => {
            const data = doc.data();
            if (!filesByQuestion[data.questionId]) {
                filesByQuestion[data.questionId] = [];
            }
            filesByQuestion[data.questionId].push(data.fileName);
        });

        // Update UI to show previously uploaded files
        Object.entries(filesByQuestion).forEach(([questionId, fileNames]) => {
            const fileChosenSpan = document.querySelector(`#${questionId}`).parentElement.querySelector('.file-chosen');
            const label = document.querySelector(`#${questionId}`).parentElement.querySelector('.file-label');
            
            if (fileNames.length > 0) {
                label.classList.add('has-files');
                fileChosenSpan.textContent = fileNames.length === 1 
                    ? fileNames[0]
                    : `${fileNames.length} files uploaded`;
                fileChosenSpan.classList.add('show');
            }
        });

    } catch (error) {
        console.error('Error loading previous files:', error);
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