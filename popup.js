let currentEnabledState = false;

const PRESET_TEMPLATES = {
    retail: {
        "Customer": "Shopper",
        "Order": "Purchase",
        "Product": "Item",
        "Inventory": "Stock",
        "Started Checkout": "Started Purchase",
        "Placed Order": "Completed Purchase",
        "Abandoned Cart": "Abandoned Basket",
        "Added to Cart": "Added to Basket",
        "Viewed Product": "Viewed Item",
        "Customer Lifetime Value": "Shopper Value",
        "Average Order Value": "Average Purchase Value",
        "Joggers": "Active Item Plus",
        "Drawstring": "Casual Item",
        "Cotton Drawstring": "Cotton Item Plus",
        "Hat": "Essential Item",
        "Vest": "Core Item",
        "Tee": "Basic Item",
        "Tote": "Carry Item",
        "Umbrella": "Weather Item",
        "Rain Jacket": "Protection Item Plus",
        "Sweatshirt": "Comfort Item"
    },
    healthcare: {
        "Customer": "Patient",
        "Order": "Appointment",
        "Product": "Treatment",
        "Subscription": "Care Plan",
        "Started Checkout": "Started Booking",
        "Placed Order": "Confirmed Appointment",
        "Abandoned Cart": "Incomplete Booking",
        "Added to Cart": "Selected Treatment",
        "Viewed Product": "Viewed Treatment",
        "Customer Lifetime Value": "Patient Lifetime Value",
        "Average Order Value": "Average Treatment Value",
        "Joggers": "Movement Treatment Plus",
        "Drawstring": "Comfort Treatment",
        "Cotton Drawstring": "Premium Treatment Plus",
        "Hat": "Basic Treatment",
        "Vest": "Core Treatment",
        "Tee": "Essential Treatment",
        "Tote": "Support Treatment",
        "Umbrella": "Protection Treatment",
        "Rain Jacket": "Weather Treatment Plus",
        "Sweatshirt": "Comfort Treatment Plus"
    },
    finance: {
        "Customer": "Client",
        "Order": "Transaction",
        "Product": "Investment",
        "Subscription": "Portfolio",
        "Started Checkout": "Started Transaction",
        "Placed Order": "Completed Transaction",
        "Abandoned Cart": "Abandoned Transaction",
        "Added to Cart": "Added to Portfolio",
        "Viewed Product": "Viewed Investment",
        "Customer Lifetime Value": "Client Lifetime Value",
        "Average Order Value": "Average Transaction Value",
        "Joggers": "Business Casual Pants",
        "Drawstring": "Casual Office Wear",
        "Cotton Drawstring": "Cotton Office Pants",
        "Hat": "Business Cap",
        "Vest": "Business Vest",
        "Tee": "Casual Friday Shirt",
        "Tote": "Business Bag",
        "Umbrella": "Executive Umbrella",
        "Rain Jacket": "Business Rain Coat",
        "Sweatshirt": "Office Sweater"
    },
    wellness: {
        "Customer": "Member",
        "Order": "Session",
        "Product": "Service",
        "Subscription": "Membership",
        "Started Checkout": "Started Booking",
        "Placed Order": "Booked Session",
        "Abandoned Cart": "Incomplete Booking",
        "Added to Cart": "Selected Service",
        "Viewed Product": "Viewed Service",
        "Customer Lifetime Value": "Member Lifetime Value",
        "Average Order Value": "Average Session Value",
        "Sales": "Bookings",
        "Revenue": "Revenue",
        "Purchase": "Booking",
        "Inventory": "Availability",
        "Store": "Location",
        "Checkout": "Book Now",
        "Shopping Cart": "Selected Services",
        "Add to Cart": "Select Service",
        "Buy Now": "Book Now",
        "Payment": "Payment",
        "Shipping": "Location",
        "Delivery": "Service Delivery",
        "Joggers": "Movement Service Plus",
        "Drawstring": "Comfort Service",
        "Cotton Drawstring": "Premium Service Plus",
        "Hat": "Basic Service",
        "Vest": "Core Service",
        "Tee": "Essential Service",
        "Tote": "Support Service",
        "Umbrella": "Protection Service",
        "Rain Jacket": "Weather Service Plus",
        "Sweatshirt": "Comfort Service Plus"
    },
    athletic: {
        "Product": "Activewear",
        "Joggers": "Performance Joggers",
        "Drawstring": "Comfort Drawstring",
        "Cotton Drawstring": "Cotton Comfort Drawstring",
        "Hat": "Performance Cap",
        "Vest": "Training Vest",
        "Tee": "Performance Tee",
        "Tote": "Gym Tote",
        "Umbrella": "All-Weather Umbrella",
        "Rain Jacket": "Weather-Resistant Jacket",
        "Sweatshirt": "Performance Sweatshirt",
        "Store": "Fitness Store",
        "Inventory": "Athletic Gear",
        "Shopping": "Gear Shopping",
        "Customer": "Athlete",
        "Order": "Gear Order"
    }
};

function createMappingNode(original = '', replacement = '') {
    const node = document.createElement('div');
    node.className = 'mapping-node';
    node.innerHTML = `
        <input type="text" class="mapping-input original" value="${original}" placeholder="Original">
        <span class="mapping-arrow">→</span>
        <input type="text" class="mapping-input replacement" value="${replacement}" placeholder="Replacement">
        <button class="delete-mapping" title="Delete mapping">✕</button>
    `;

    node.querySelector('.delete-mapping').addEventListener('click', () => {
        node.remove();
    });

    return node;
}

// Add this near the top of the file to ensure the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyze-url');
    const resultsContainer = document.getElementById('analysis-results');

    if (analyzeButton) {
        analyzeButton.addEventListener('click', async () => {
            const urlInput = document.getElementById('website-url');
            const url = urlInput.value.trim();

            if (!url) {
                resultsContainer.innerHTML = `
                    <div class="error-message">Please enter a valid website URL</div>
                `;
                return;
            }

            resultsContainer.innerHTML = 'Analyzing website...';

            try {
                // Create a new tab with the URL
                const tab = await chrome.tabs.create({ url, active: false });

                // Wait for the page to load
                await new Promise(resolve => setTimeout(resolve, 3000));

                // Execute content script to get website content
                const [response] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        const mainContent = document.querySelector('main') || document.body;
                        return {
                            text: mainContent.innerText,
                            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                            metaKeywords: document.querySelector('meta[name="keywords"]')?.content || '',
                            h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join(' '),
                            title: document.title,
                            url: window.location.href
                        };
                    }
                });

                // Close the temporary tab
                chrome.tabs.remove(tab.id);

                // Pass resultsContainer to analyzeWithOpenAI
                const analysis = await analyzeWithOpenAI(
                    `URL: ${response.result.url}\n` +
                    `Title: ${response.result.title}\n` +
                    `H1: ${response.result.h1}\n` +
                    `Meta Description: ${response.result.metaDescription}\n` +
                    `Keywords: ${response.result.metaKeywords}\n` +
                    `Content: ${response.result.text.substring(0, 2000)}`,
                    resultsContainer
                );

            } catch (error) {
                console.error('Analysis error:', error);
                resultsContainer.innerHTML = `
                    <div class="error-message">
                        Error analyzing website: ${error.message}
                    </div>
                `;
            }
        });
    } else {
        console.error('Analyze button not found!');
    }
});

function updateUI() {
    const status = document.getElementById('status');
    const toggleButton = document.getElementById('toggle');

    if (currentEnabledState) {
        status.innerHTML = `
            <div class="active-status">
                <div class="status-text">
                    <span class="status-dot active"></span>
                    Replacements Active
                </div>
                <span class="status-hint">Changes apply automatically</span>
            </div>
        `;
        toggleButton.textContent = "Disable & Reload";
        toggleButton.classList.add('active');
    } else {
        status.innerHTML = `
            <div class="inactive-status">
                <div class="status-text">
                    <span class="status-dot inactive"></span>
                    Replacements Inactive
                </div>
                <span class="status-hint">Enable to start replacing text</span>
            </div>
        `;
        toggleButton.textContent = "Enable & Reload";
        toggleButton.classList.remove('active');
    }

    const templateSelector = document.getElementById('template-select');
    templateSelector.innerHTML = `
        <option value="">Select Industry Template</option>
        ${Object.keys(PRESET_TEMPLATES).map(industry =>
        `<option value="${industry}">${industry.charAt(0).toUpperCase() + industry.slice(1)}</option>`
    ).join('')}
    `;
}

function loadMappings(mappings) {
    const MAX_RECOMMENDED_MAPPINGS = 50;
    const container = document.getElementById('mapping-nodes');
    container.innerHTML = `
        <div class="mappings-header">
            <h3>Text Replacements</h3>
            <p class="mappings-description">Enter original text and its replacement. Changes apply automatically, once enabled.</p>
        </div>
    `;

    // Get current tab to check page size
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        try {
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => document.documentElement.innerHTML.length
            });

            const pageSize = result.result;
            if (pageSize > 1000000) { // 1MB of HTML
                const warningDiv = document.createElement('div');
                warningDiv.className = 'warning-message';
                warningDiv.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Large page detected - replacements may take longer to apply</span>
                `;
                container.appendChild(warningDiv);
            }
        } catch (error) {
            console.error('Error checking page size:', error);
        }
    });

    if (Object.keys(mappings).length > MAX_RECOMMENDED_MAPPINGS) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-message';
        warningDiv.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Large number of replacements may impact performance</span>
        `;
        container.appendChild(warningDiv);
    }

    if (Object.keys(mappings).length === 0) {
        container.appendChild(createMappingNode());
    } else {
        Object.entries(mappings).forEach(([original, replacement]) => {
            container.appendChild(createMappingNode(original, replacement));
        });
    }
}

document.getElementById('add-mapping').addEventListener('click', () => {
    const container = document.getElementById('mapping-nodes');
    container.appendChild(createMappingNode());
});

document.getElementById('toggle').addEventListener('click', async () => {
    currentEnabledState = !currentEnabledState;

    try {
        // Save the current mapping state along with enabled state
        const mapping = {};
        document.querySelectorAll('.mapping-node').forEach(node => {
            const original = node.querySelector('.original').value.trim();
            const replacement = node.querySelector('.replacement').value.trim();
            if (original && replacement) {
                mapping[original] = replacement;
            }
        });

        await chrome.storage.sync.set({
            enabled: currentEnabledState,
            mapping
        });

        updateUI();

        // Get current tab and reload it to show changes
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.reload(tab.id);
    } catch (error) {
        console.error('Error saving state:', error);
        // Revert the state if saving failed
        currentEnabledState = !currentEnabledState;
        updateUI();
    }
});

document.getElementById('template-select').addEventListener('change', (e) => {
    const selected = e.target.value;
    if (selected && PRESET_TEMPLATES[selected]) {
        loadMappings(PRESET_TEMPLATES[selected]);
    }
});

// Initialize mappings on load
(async function initializeUI() {
    const { mapping, enabled } = await chrome.storage.sync.get(['mapping', 'enabled']);
    currentEnabledState = !!enabled;
    loadMappings(mapping || {});
    updateUI();
    initializeTemplateSelect();
    initializeTabs();
})();

// Add OpenAI integration
async function analyzeWithOpenAI(content, resultsContainer) {
    const OPENAI_API_KEY = config.OPENAI_API_KEY;
    const SYSTEM_PROMPT = `You are an expert at analyzing e-commerce websites to help Klaviyo sales reps personalize their demos.
    Analyze the provided website content and return ONLY a JSON object with no additional text or explanation.

    Required JSON format:
    {
        "industry": "string describing the brand's specific industry",
        "brand_voice": "string describing their tone and style",
        "mappings": {
            "Shopping Cart": "their exact cart term",
            "Product": "their exact product term",
            "Customer": "their exact customer term",
            "Order": "their exact order term",
            "Store": "their exact store term",
            "Add to Cart": "their exact add to cart text",
            "Newsletter": "their exact newsletter term",
            "Subscribe": "their exact subscribe text"
        }
    }

    Rules:
    1. Only include mappings where you find EXACT matching terms on their website
    2. Remove any mapping where you don't find their specific terminology
    3. Use their exact text/terminology - do not paraphrase or suggest alternatives
    4. Analyze buttons, links, and text for exact terminology matches
    5. Return valid JSON only - no other text or explanation

    Example valid response:
    {
        "industry": "Athletic Apparel Retail",
        "brand_voice": "Premium, performance-focused, empowering",
        "mappings": {
            "Shopping Cart": "Bag",
            "Product": "Gear",
            "Store": "Shop"
        }
    }`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: `Return a JSON object analyzing this website content:\n\n${content}`
                    }
                ],
                temperature: 0.3 // Lower temperature for more consistent output
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || 'OpenAI API error');
        }

        let analysis;
        try {
            const rawResponse = data.choices[0].message.content.trim();
            console.log('Raw AI Response:', rawResponse); // Debug log
            analysis = JSON.parse(rawResponse);

            // Validate response structure
            if (!analysis.industry || !analysis.brand_voice || !analysis.mappings) {
                throw new Error('Missing required fields in AI response');
            }

            // Display the results with brand context
            resultsContainer.innerHTML = `
                <div class="suggestions-container">
                    <div class="analysis-context">
                        <h3>Brand Analysis</h3>
                        <p><strong>Industry:</strong> ${analysis.industry}</p>
                        <p><strong>Brand Voice:</strong> ${analysis.brand_voice}</p>
                    </div>
                    <h3>Suggested Mappings</h3>
                    <div class="suggested-mappings">
                        ${Object.entries(analysis.mappings)
                    .map(([klaviyo, brand]) => `
                                <div class="suggestion-item">
                                    <input type="checkbox" checked>
                                    <span class="original">${klaviyo}</span>
                                    <span class="arrow">→</span>
                                    <span class="replacement">${brand}</span>
                                </div>
                            `).join('')}
                    </div>
                    <button id="apply-suggestions" class="analyze-button">
                        Apply Selected Mappings
                    </button>
                </div>
            `;

            // Add event listener for applying suggestions
            document.getElementById('apply-suggestions').addEventListener('click', () => {
                const selectedMappings = {};
                document.querySelectorAll('.suggestion-item input:checked').forEach(checkbox => {
                    const item = checkbox.closest('.suggestion-item');
                    const original = item.querySelector('.original').textContent;
                    const replacement = item.querySelector('.replacement').textContent;
                    selectedMappings[original] = replacement;
                });

                // Apply the mappings
                loadMappings(selectedMappings);

                // Save to storage
                chrome.storage.sync.set({ mapping: selectedMappings }, () => {
                    resultsContainer.innerHTML = `
                        <div class="success-card">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            <span>Mappings applied successfully!</span>
                        </div>
                    `;
                });
            });

            return analysis;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Failed Response:', data.choices[0].message.content);
            throw new Error('Invalid response format from AI - please try again');
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);
        resultsContainer.innerHTML = `
            <div class="error-message">
                ${error.message}
                <br><small>Please try again</small>
            </div>
        `;
        throw error;
    }
}

// Update the analyze site function
async function analyzeSiteAndSuggestMappings() {
    const analyzeButton = document.getElementById('analyze-site');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const suggestedMappings = document.getElementById('suggested-mappings');

    try {
        analyzeButton.disabled = true;
        analyzeButton.innerHTML = '<span class="loading-spinner"></span> Analyzing...';

        // Get current tab content
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [response] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const mainContent = document.querySelector('main') || document.body;
                return {
                    text: mainContent.innerText,
                    metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                    metaKeywords: document.querySelector('meta[name="keywords"]')?.content || '',
                    h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join(' '),
                    title: document.title
                };
            }
        });

        // Analyze with OpenAI
        const analysis = await analyzeWithOpenAI(
            `Title: ${response.result.title}\n` +
            `H1: ${response.result.h1}\n` +
            `Meta Description: ${response.result.metaDescription}\n` +
            `Keywords: ${response.result.metaKeywords}\n` +
            `Content: ${response.result.text.substring(0, 2000)}` // Limit content length
        );

        // Display suggestions
        suggestionsContainer.classList.remove('hidden');
        suggestedMappings.innerHTML = Object.entries(analysis.mappings)
            .map(([original, replacement]) => `
                <div class="suggestion-item">
                    <input type="checkbox" checked>
                    <span class="original">${original}</span>
                    <span class="arrow">→</span>
                    <span class="replacement">${replacement}</span>
                </div>
            `).join('');

        // Update industry template if detected
        if (analysis.industry && PRESET_TEMPLATES[analysis.industry.toLowerCase()]) {
            document.getElementById('template-select').value = analysis.industry.toLowerCase();
        }

    } catch (error) {
        console.error('Analysis error:', error);
        suggestedMappings.innerHTML = `
            <div class="error-message">
                Sorry, there was an error analyzing the site. Please try again.
            </div>
        `;
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
            Analyze Site
        `;
    }
}

// Add event listeners
document.getElementById('analyze-site').addEventListener('click', analyzeSiteAndSuggestMappings);
document.getElementById('apply-suggestions').addEventListener('click', () => {
    const checkedSuggestions = document.querySelectorAll('.suggestion-item input:checked');
    const newMappings = {};

    checkedSuggestions.forEach(checkbox => {
        const item = checkbox.closest('.suggestion-item');
        const original = item.querySelector('.original').textContent;
        const replacement = item.querySelector('.replacement').textContent;
        newMappings[original] = replacement;
    });

    loadMappings(newMappings);
    document.getElementById('suggestions-container').classList.add('hidden');
});

// Update the AI analysis button click handler
document.getElementById('analyze-ai').addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('ai-analysis.html')
    });
    window.close(); // Close the popup
});

// Add UI elements to popup.html

// Add tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Show corresponding tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            if (content.id === `${button.dataset.tab}-tab`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    });
});

// Add AI analysis functionality
document.getElementById('analyze-url').addEventListener('click', async () => {
    const urlInput = document.getElementById('website-url');
    const resultsContainer = document.getElementById('analysis-results');

    // Add test message
    resultsContainer.innerHTML = 'Clicked!';

    const url = urlInput.value.trim();

    if (!url) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                Please enter a valid website URL
            </div>
        `;
        return;
    }

    try {
        resultsContainer.innerHTML = `
            <div class="analysis-status">
                <div class="loading-spinner"></div>
                <div>Analyzing website content...</div>
            </div>
        `;

        // Fetch website content
        const response = await fetch(url);
        const html = await response.text();

        // Extract relevant content using DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = {
            title: doc.title,
            metaDescription: doc.querySelector('meta[name="description"]')?.content || '',
            metaKeywords: doc.querySelector('meta[name="keywords"]')?.content || '',
            h1: Array.from(doc.querySelectorAll('h1')).map(h => h.textContent).join(' '),
            mainContent: doc.querySelector('main')?.textContent || doc.body.textContent
        };

        // Analyze with OpenAI
        const analysis = await analyzeWithOpenAI(content, resultsContainer);

        // Display results
        resultsContainer.innerHTML = `
            <div class="suggestions-container">
                <h3>Suggested Mappings</h3>
                <div class="suggested-mappings">
                    ${Object.entries(analysis.mappings)
                .map(([original, replacement]) => `
                            <div class="suggestion-item">
                                <input type="checkbox" checked>
                                <span class="original">${original}</span>
                                <span class="arrow">→</span>
                                <span class="replacement">${replacement}</span>
                            </div>
                        `).join('')}
                </div>
                <button id="apply-url-suggestions" class="analyze-button">
                    Apply Selected Mappings
                </button>
            </div>
        `;

        // Add event listener for applying suggestions
        document.getElementById('apply-url-suggestions').addEventListener('click', () => {
            const selectedMappings = {};
            document.querySelectorAll('.suggestion-item input:checked').forEach(checkbox => {
                const item = checkbox.closest('.suggestion-item');
                const original = item.querySelector('.original').textContent;
                const replacement = item.querySelector('.replacement').textContent;
                selectedMappings[original] = replacement;
            });

            loadMappings(selectedMappings);
            resultsContainer.innerHTML = '<div class="success-message">Mappings applied successfully!</div>';
        });

    } catch (error) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                Error analyzing website: ${error.message}
            </div>
        `;
    }
});

// Add this near the top of popup.js, after the PRESET_TEMPLATES definition
function initializeTemplateSelect() {
    const templateSelect = document.getElementById('template-select');
    templateSelect.innerHTML = `
        <option value="">Select a template</option>
        ${Object.keys(PRESET_TEMPLATES).map(template => `
            <option value="${template}">${template.charAt(0).toUpperCase() + template.slice(1)}</option>
        `).join('')}
    `;
}

// Add tab switching functionality
function initializeTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            // Show corresponding tab content
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
}


