# Quiz Application

This project is a simple web-based quiz application built using HTML, CSS, JavaScript, Bootstrap, and htmx. The application allows users to take a quiz consisting of multiple-choice, short answer, and programming questions.

## Project Structure

```
quiz-app
├── src
│   ├── css
│   │   └── styles.css          # Custom styles for the quiz application
│   ├── js
│   │   └── quiz.js             # JavaScript logic for handling quiz functionality
│   ├── index.html              # Main HTML file for the quiz application
│   ├── sections
│   │   ├── section-a.html      # HTML for Section A (Multiple Choice Questions)
│   │   ├── section-b.html      # HTML for Section B (Short Answer Questions)
│   │   └── section-c.html      # HTML for Section C (Programming Questions)
│   └── components
│       ├── mcq.html            # HTML structure for multiple-choice questions
│       ├── short-answer.html    # HTML structure for short answer questions
│       └── programming.html     # HTML structure for programming questions
├── assets
│   └── scripts
│       ├── htmx.min.js         # Minified version of the htmx library
│       └── bootstrap.min.js     # Minified version of the Bootstrap JavaScript library
└── README.md                   # Documentation for the project
```

## Getting Started

To run the quiz application, follow these steps:

1. Clone the repository to your local machine.
2. Open the `index.html` file in your web browser.
3. Follow the on-screen instructions to complete the quiz.

## Features

- Responsive design using Bootstrap
- Dynamic content loading with htmx
- Multiple sections for different types of questions
- Customizable styles through CSS

## License

This project is licensed under the MIT License.