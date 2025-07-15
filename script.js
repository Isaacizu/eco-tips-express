/**
 * Makes an asynchronous call to the Gemini API to generate content based on a given prompt.
 *
 * @param {string} prompt - The text prompt to send to the Gemini API.
 * @returns {Promise<string>} A promise that resolves with the generated text from Gemini.
 * Resolves to an empty string if an error occurs or no content is found.
 */
async function getGeminiResponse(prompt) {
    // API key for gemini-2.0-flash model
    const geminiApiKey = "AIzaSyBkkHw_COSkXs6ko5dDzfT3sHSfUKrja9Q"; 
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            return text;
        } else {
            console.warn("Unexpected API response structure or no content found:", result);
            return "";
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "";
    }
}

/**
 * Generates an image using the Imagen API and displays it in the specified img element.
 *
 * @param {string} prompt - The prompt for image generation.
 * @param {string} imageId - The ID of the <img> element to display the image.
 * @param {string} loadingSpinnerId - The ID of the loading spinner element.
 */
async function generateAndDisplayImage(prompt, imageId, loadingSpinnerId) {
    const imgElement = document.getElementById(imageId);
    const loadingSpinner = document.getElementById(loadingSpinnerId);

    imgElement.style.display = 'none'; // Hide image while loading
    loadingSpinner.style.display = 'block'; // Show loading spinner

    const imagenApiKey = ""; // API key for imagen-3.0-generate-002, Canvas will provide it.
    const payload = { instances: { prompt: prompt }, parameters: { "sampleCount": 1 } };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${imagenApiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
            const imageUrl = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
            imgElement.src = imageUrl;
            imgElement.style.display = 'block'; // Show image
            loadingSpinner.style.display = 'none'; // Hide loading spinner
        } else {
            console.warn("Unexpected image API response structure or no image found:", result);
            imgElement.src = `https://placehold.co/600x350/FF0000/FFFFFF?text=Error`; // Fallback error image
            imgElement.style.display = 'block';
            loadingSpinner.style.display = 'none';
        }
    } catch (error) {
        console.error("Error generating image:", error);
        imgElement.src = `https://placehold.co/600x350/FF0000/FFFFFF?text=Error`; // Fallback error image
        imgElement.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

// Function to check if the user's input is relevant to sustainability
function isRelevant(text) {
    const relevantKeywords = [
        "sostenibilidad", "medio ambiente", "ecología", "reciclaje", "energía",
        "agua", "clima", "contaminación", "recursos", "planeta", "naturaleza",
        "verde", "eco", "futuro", "desarrollo sostenible", "huella de carbono",
        "biodiversidad", "residuos", "consumo", "impacto ambiental", "cambio climático",
        "renovable", "solar", "eólico", "conservación", "ahorro", "eficiencia",
        "ambiente", "ecosistema", "contaminantes", "reutilizar", "reducir", "proteger",
        "cuidar", "limpio", "salud", "biodiversidad", "calentamiento global"
    ];
    const lowerCaseText = text.toLowerCase();
    return relevantKeywords.some(keyword => lowerCaseText.includes(keyword));
}

// --- Page Navigation Logic ---
const navButtons = {
    purpose: document.getElementById('navPurpose'),
    information: document.getElementById('navInformation')
};

const pageContents = {
    purpose: document.getElementById('purposePage'),
    information: document.getElementById('informationPage')
};

let currentPage = 'purpose'; // Initial active page

function showPage(pageId) {
    // Hide all pages
    for (const id in pageContents) {
        pageContents[id].classList.remove('active');
    }
    // Deactivate all nav buttons
    for (const id in navButtons) {
        navButtons[id].classList.remove('active');
    }

    // Show the selected page
    pageContents[pageId].classList.add('active');
    // Activate the corresponding nav button
    navButtons[pageId].classList.add('active');
    currentPage = pageId; // Update current page state

    // Reset animations for the information page when it becomes active
    if (pageId === 'information') {
        const infoItems = document.querySelectorAll('#informationPage .info-item');
        infoItems.forEach(item => {
            item.style.opacity = 0; // Reset opacity
            item.style.animation = 'none'; // Remove animation
            item.offsetHeight; // Trigger reflow
            item.style.animation = ''; // Re-apply animation
        });

        // Generate and display images when the Information page is shown
        generateAndDisplayImage("sustainable development, green planet, interconnected elements, harmony, global impact", "sustainabilityImage", "sustainabilityImageLoading");
        generateAndDisplayImage("eco-friendly solutions, renewable energy, clean water, thriving nature, community", "purposeImage", "purposeImageLoading");
        generateAndDisplayImage("person saving money, healthy lifestyle, clean air, green home, happy family", "benefitsImage", "benefitsImageLoading");
        generateAndDisplayImage("healthy earth, clean oceans, lush forests, diverse wildlife, future generations", "careImage", "careImageLoading");
    }
}

// Add event listeners to navigation buttons
navButtons.purpose.addEventListener('click', () => showPage('purpose'));
navButtons.information.addEventListener('click', () => showPage('information'));

// --- AI Interaction Logic for Each Page ---

// Function to handle AI tip generation for any page
async function handleGetTip(inputElementId, resultsDivId, promptPrefix) {
    const inputElement = document.getElementById(inputElementId);
    const resultsDiv = document.getElementById(resultsDivId);
    const userTopic = inputElement.value.trim();

    if (userTopic !== '') {
        // Check for relevance before calling Gemini API
        if (isRelevant(userTopic)) {
            resultsDiv.innerHTML = `<p class="loading-message">Cargando eco-consejo sobre "${userTopic}"...</p>`;
            resultsDiv.classList.remove('show-result'); // Remove animation class before new content

            // Construct the specialized prompt for Gemini
            const geminiPrompt = `${promptPrefix} ${userTopic}.`;

            try {
                const ecoTip = await getGeminiResponse(geminiPrompt);

                if (ecoTip) {
                    // Replace newlines with <br> tags
                    let formattedEcoTip = ecoTip.replace(/\n/g, '<br>');
                    // Replace *text* with <b>text</b> for bolding
                    formattedEcoTip = formattedEcoTip.replace(/\*(.*?)\*/g, '<b>$1</b>');

                    resultsDiv.innerHTML = `
                        <p class="user-query">Tu consulta: "${userTopic}"</p>
                        <p class="gemini-response">${formattedEcoTip}</p>
                    `;
                    resultsDiv.classList.add('show-result'); // Add animation class after content is loaded
                } else {
                    resultsDiv.innerHTML = `<p class="error-message text-red-600">No se pudo obtener un eco-consejo. Inténtalo de nuevo.</p>`;
                }
            } catch (error) {
                console.error("Error al obtener el eco-consejo:", error);
                resultsDiv.innerHTML = `<p class="error-message text-red-600">Ocurrió un error al obtener el eco-consejo. Por favor, inténtalo más tarde.</p>`;
            }
        } else {
            // Display error message if the input is not relevant
            resultsDiv.innerHTML = `<p class="error-message text-red-600">Lo sentimos, tu pregunta no parece estar relacionada con temas de sostenibilidad. Por favor, intenta con un tema ambiental.</p>`;
            resultsDiv.classList.remove('show-result'); // Ensure no animation if error
        }
    } else {
        // Show an error message if the input is empty
        resultsDiv.innerHTML = `<p class="error-message text-red-600">Por favor, introduce un tema o pregunta.</p>`;
        resultsDiv.classList.remove('show-result'); // Ensure no animation if error
    }
}

// Get references to the HTML elements for the Purpose page input and button
const purposeTipInput = document.getElementById('purposeTipInput');
const purposeGetTipButton = document.getElementById('purposeGetTipButton');

// Add a click listener to the Purpose page button
purposeGetTipButton.addEventListener('click', () => {
    handleGetTip(
        'purposeTipInput',
        'purposeResults',
        'Dame 5 consejos breves y prácticos sobre'
    );
});

// Add keydown listener to the Purpose page input field to trigger button click on Enter
purposeTipInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default action (e.g., form submission)
        purposeGetTipButton.click(); // Programmatically click the button
    }
});
