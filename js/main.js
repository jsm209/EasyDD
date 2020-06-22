import DataProcessor from "./modules/DataProcessor.js";
import * as ui from "./modules/userInterface.js";
import { $ } from "./modules/utils.js";

const defaultExcludedWords = ["I", "COVID", "DD", "WSB", "US", "OTM", "ITM", "FED", "ETF", "CEO", "TLDR", "UPDATE", "YOLO", "IV", "FOMO", "FREE", "TENDIE", "BULL", "BULLS", "BEAR", "BEARS", "SHORT", "INVEST", "RH", "EST", "AMEN", "NOT", "EOD", "CPU", "EDIT"];

let maxPages = $("maxPages").value;
let curDDPage = 1;

// Initialization
var dp = new DataProcessor();
dp.setExcludedWords(defaultExcludedWords);
ui.updateExcludedTickerDisplay(defaultExcludedWords);
refresh();

// Event Listeners for generation settings
$("addTickers").addEventListener("click", () => {
    ui.handleAddTickers(dp.getExcludedWords());
});

$("maxPages").addEventListener("change", () => {
    $("maxPagesFeedback").textContent = "( " + $("maxPages").value + " / 100 )";
});

$("generate").addEventListener("click", () => {
    refresh();
    $("generate").style.visibility = "hidden";

    dp.generate("https://www.reddit.com/r/wallstreetbets/", maxPages);
});


// Event listeners for pagination
$("ddNext").addEventListener("click", () => {
    dp.nextDDPage();
})

$("ddPrev").addEventListener("click", () => {
    dp.prevDDPage();
})

// Will refresh the data processor with correct form inputs
// and wipe the screen of previously fetched results.
function refresh() {
    dp.clearStockTickerCounts();
    $("tickers").innerHTML = "";
    $("dd").innerHTML = "";
    dp.clearDDPosts();

    dp.setTopTickerCount($("topTickerCount").value);
    maxPages = $("maxPages").value;
    dp.setMaxPages(maxPages);
    dp.setAllowOneLetterTickers($("allowOneLetterTickers").checked);
    $("topTickersLabel").textContent = "Top " + $("topTickerCount").value + " Most Recently Mentioned Tickers"
}



