class RoutingException extends Error {
    constructor(message, errorId) {
        super(message);
        this.name = "RoutingException";
        this.errorId = errorId;
    }
}

function generatePromptAndRouteToLanguageModel(event, conceptText, languageModelProvider) {
    const isEventValid = event !== null && event !== undefined;
    if (isEventValid) { event.stopPropagation(); }

    console.info("[HUBUI100I] Starting prompt generation and routing...");
    try {
        const aiPrefixedConcept = "AI " + conceptText;
        const generatedPromptText = "I would like a detailed explanation of how to implement " + aiPrefixedConcept + ".";
        const urlEncodedPrompt = encodeURIComponent(generatedPromptText);

        const languageModelUrls = {
            "ChatGPT": "https://chatgpt.com/?q=",
            "Perplexity": "https://www.perplexity.ai/?q=",
            "Claude": "https://claude.ai/new?q="
        };

        const isProviderValid = languageModelProvider in languageModelUrls;

        if (isProviderValid) {
            const targetRoutingUrl = languageModelUrls[languageModelProvider] + urlEncodedPrompt;
            window.open(targetRoutingUrl, '_blank');
            console.info("[HUBUI101I] Routing to " + languageModelProvider + " completed successfully.");
        } else {
            throw new RoutingException("Provider mapping not found.", "[HUBUI102E]");
        }
    } catch (executionError) {
        const isCustomException = executionError instanceof RoutingException;
        if (isCustomException) {
            console.error(`${executionError.errorId} Prompt generation and routing completed unsuccessfully. Details: ${executionError.message}`);
        } else {
            console.error(`[HUBUI103E] Prompt generation and routing completed unsuccessfully. Details: ${executionError.message}`);
        }
    }
}
