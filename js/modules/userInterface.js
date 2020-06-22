import { $ } from "./utils.js";

const loadingPhrases = ["Pumping and dumping...", "Loading up on TSLA...", "Collecting tendies...", "Banking on SPY puts...", "Waiting for the next market crash...", "Attempting to time the market...", "Trying to trade on a holiday...", "Currently in the red...", "Having a green day..."];
let selectedLoadingPhrase = "";

function updateGenerateFeedback(currentPageNum, maxPageNum) {
    if (selectedLoadingPhrase == "") {
        selectedLoadingPhrase = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
    } else {
        let random = Math.random();
        if (random < 0.4) {
            selectedLoadingPhrase = loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)];
        }
    }
    $("generateFeedback").innerText = selectedLoadingPhrase + " ( " + currentPageNum + " / " + maxPageNum + " )";
}

function handleAddTickers(excludedWords) {
    let input = $("excluded");
    let newTickers = input.value;
    if (newTickers != "") {
        newTickers = newTickers.split(",");
        for (let i = 0; i < newTickers.length; i++) {
            let text = newTickers[i];
            text = newTickers[i].replace(" ", "");
            if (!excludedWords.includes(text)) {
                excludedWords.push(text);
            }
        }
        updateExcludedTickerDisplay(excludedWords);
        input.value = "";
    }
}

function updateExcludedTickerDisplay(excludedWords) {
    let excludedText = excludedWords[0];
    for (let i = 1; i < excludedWords.length; i++) {
        excludedText = excludedText + ", " + excludedWords[i];
    }
    $("excludedWords").textContent = excludedText;
}

function updateCollapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    var i;

    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
}

export { handleAddTickers, updateExcludedTickerDisplay, updateCollapsibles, updateGenerateFeedback }