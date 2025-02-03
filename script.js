const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// MSK API configuration
const MSK_API = {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    key: 'AIzaSyAF8DbxiwFwgZ5dGXda-B4Af5UMtSdq_j0'
};

async function getMSKResponse(query, language) {
    try {
        let prompt = '';
        if (language === 'hindi') {
            prompt = `${query} - इस सवाल का जवाब दो। जवाब में "Gemini" की जगह "MSK" का इस्तेमाल करो।`;
        } else if (language === 'hinglish') {
            prompt = `${query} - Is sawal ka jawab do. Answer me "Gemini" ki jagah "MSK" use karo.`;
        } else {
            prompt = `${query} - Answer this question. Replace "Gemini" with "MSK" in the response.`;
        }

        const response = await fetch(`${MSK_API.url}?key=${MSK_API.key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });

        const data = await response.json();
        let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (answer) {
            answer = answer.replace(/Gemini/g, 'MSK');
            answer = answer.replace(/gemini/g, 'MSK');
        }
        return answer;
    } catch (error) {
        console.error('API error:', error);
        return null;
    }
}

function formatResponse(answer, language) {
    if (!answer) {
        return generateFallbackResponse(language);
    }

    if (language === 'hindi') {
        return `उत्तर:\n${answer}`;
    } else if (language === 'hinglish') {
        return `Answer:\n${answer}`;
    } else {
        return `Answer:\n${answer}`;
    }
}

function detectLanguage(text) {
    const hindiPattern = /[\u0900-\u097F]/;
    const englishPattern = /^[A-Za-z\s.,!?]+$/;
    
    if (hindiPattern.test(text)) {
        return 'hindi';
    } else if (englishPattern.test(text)) {
        return 'english';
    }
    return 'hinglish';
}

function generateFallbackResponse(language) {
    const responses = {
        hindi: "कृपया दुबारा कोशिश करें",
        hinglish: "Please dobara try karo",
        english: "Please try again"
    };
    return responses[language];
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot';
    const language = detectLanguage(message);
    loadingDiv.innerHTML = '<p>...</p>';
    chatMessages.appendChild(loadingDiv);

    try {
        const answer = await getMSKResponse(message, language);
        chatMessages.removeChild(loadingDiv);
        const formattedResponse = formatResponse(answer, language);
        addMessage(formattedResponse);
    } catch (error) {
        console.error('Error:', error);
        if (loadingDiv.parentNode) {
            chatMessages.removeChild(loadingDiv);
        }
        addMessage(generateFallbackResponse(language));
    }
}

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const messageP = document.createElement('p');
    messageP.textContent = message;
    
    messageDiv.appendChild(messageP);
    chatMessages.appendChild(messageDiv);
    
    const clearDiv = document.createElement('div');
    clearDiv.className = 'clear';
    chatMessages.appendChild(clearDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event Listeners
sendButton.addEventListener('click', async () => {
    sendButton.disabled = true;
    await sendMessage();
    sendButton.disabled = false;
});

userInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.disabled = true;
        await sendMessage();
        sendButton.disabled = false;
    }
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = (userInput.scrollHeight) + 'px';
});

document.addEventListener('DOMContentLoaded', function() {
    const documentInput = document.getElementById('documentInput');
    const fileName = document.getElementById('fileName');
    const analyzeBtn = document.querySelector('.analyze-btn');
    const uploadForm = document.getElementById('uploadForm');
    const loader = document.querySelector('.loader');
    const resultContent = document.querySelector('.result-content');

    // Handle file selection
    documentInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            analyzeBtn.disabled = false;
        } else {
            fileName.textContent = '';
            analyzeBtn.disabled = true;
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const file = documentInput.files[0];
        if (!file) return;

        // Show loader
        loader.style.display = 'block';
        resultContent.textContent = '';
        analyzeBtn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('document', file);

            // Send file to backend for processing
            const response = await fetch('/analyze-document', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const result = await response.json();
            
            // Display analysis result
            resultContent.innerHTML = `
                <h3>Analysis Results:</h3>
                <div class="analysis-content">
                    ${result.analysis}
                </div>
            `;
        } catch (error) {
            resultContent.innerHTML = `
                <div class="error-message">
                    Sorry, there was an error analyzing your document. Please try again.
                </div>
            `;
        } finally {
            loader.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });
});
