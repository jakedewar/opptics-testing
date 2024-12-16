// On page load, run if enabled
(async function () {
    const { mapping, enabled } = await chrome.storage.sync.get(['mapping', 'enabled']);
    if (enabled && mapping && Object.keys(mapping).length > 0) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                applyReplacements(mapping);
            });
        } else {
            applyReplacements(mapping);
        }
    }
})();

// Update message listener
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'runReplacementsNow') {
        const { mapping, enabled } = await chrome.storage.sync.get(['mapping', 'enabled']);
        if (enabled && mapping && Object.keys(mapping).length > 0) {
            applyReplacements(mapping);
        }
    }
});

function applyReplacements(mapping) {
    // Validate mapping
    if (!mapping || Object.keys(mapping).length === 0) return;

    console.log('Starting replacements with mapping:', mapping);

    // Create individual regexes for better reliability
    const replacements = Object.entries(mapping).map(([original, replacement]) => ({
        regex: new RegExp(`\\b${escapeRegex(original)}\\b`, 'gi'),
        replacement
    }));

    function processTextNode(node) {
        if (!node || !node.nodeValue) return;

        let text = node.nodeValue;
        let changed = false;

        for (const { regex, replacement } of replacements) {
            // Reset regex state
            regex.lastIndex = 0;

            if (regex.test(text)) {
                // Reset again before replace
                regex.lastIndex = 0;
                text = text.replace(regex, replacement);
                changed = true;
            }
        }

        if (changed) {
            console.log('Replaced text:', {
                original: node.nodeValue,
                new: text
            });
            node.nodeValue = text;
        }
    }

    function processNode(node) {
        if (!node) return;

        // Skip if node is in an excluded element
        if (node.nodeType === Node.ELEMENT_NODE &&
            (node.tagName === 'SCRIPT' ||
                node.tagName === 'STYLE' ||
                node.tagName === 'INPUT' ||
                node.tagName === 'TEXTAREA' ||
                node.isContentEditable)) {
            return;
        }

        // Process text nodes
        if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node);
            return;
        }

        // Recursively process child nodes
        const children = Array.from(node.childNodes);
        for (const child of children) {
            processNode(child);
        }
    }

    // Initial processing
    processNode(document.body);

    // Set up observer for dynamic content
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Process new nodes
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    processNode(node);
                });
            }
            // Process changed text
            else if (mutation.type === 'characterData') {
                processTextNode(mutation.target);
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
