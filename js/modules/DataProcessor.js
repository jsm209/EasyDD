import { $, unEntity, sortTopOccurences } from "./utils.js";
import { updateGenerateFeedback } from "./userInterface.js";

// Store DD in array for pagination
// also for filtering the array

// add filters for sorting by most upvotes, most comments
// also to cull results past a given date

// Have generate store posts instead of building it out as it's retrieved
// then filter then build later.


class DataProcessor {
    constructor() {
        this.excludedWords = [];
        this.topTickerCount = 10;
        this.allowOneLetterTickers = false;
        this.stockTickerCounts = {};
        this.maxPages = 0;
        this.ddPosts = [];
        this.ddPostsMaxPaginationSize = 10;
        this.ddCurPaginationPage = 1;
    }

    setMaxPages(limit) {
        this.maxPages = limit;
    }

    setExcludedWords(words) {
        this.excludedWords = words;
    }

    getExcludedWords() {
        return this.excludedWords;
    }

    setTopTickerCount(limit) {
        this.topTickerCount = limit;
    }

    setAllowOneLetterTickers(bool) {
        this.allowOneLetterTickers = bool;
    }

    clearStockTickerCounts() {
        this.stockTickerCounts = {};
    }

    getStockTickerCounts() {
        return this.stockTickerCounts;
    }

    clearDDPosts() {
        this.ddPosts = [];
    }

    getMaxDDPage() {
        // Calculate the max page we can go to 
        let maxDDPage = Math.floor(this.ddPosts.length / this.ddPostsMaxPaginationSize);

        // If there is a remainder, we increase the page limit by 1 to account
        // a page of the remainders.
        if (this.ddPosts.length - maxDDPage * this.ddPostsMaxPaginationSize > 0) {
            maxDDPage++;
        }

        return maxDDPage;
    }

    prevDDPage() {
        // Minimum Page
        let minDDPage = 1;

        // If we can go to the prev page and its valid, do it.
        // If not, do nothing.
        if (this.ddCurPaginationPage - 1 >= minDDPage) {
            this.ddCurPaginationPage = this.ddCurPaginationPage - 1;
            this.displayDDPage(this.ddCurPaginationPage);
        }

        $("ddPageCount").textContent = "( " + this.ddCurPaginationPage + " / " + this.getMaxDDPage() + " )";
    }

    nextDDPage() {
        // Calculate the max page we can go to 
        let maxDDPage = this.getMaxDDPage();

        // If we can go to the next page and its valid, do it.
        // If not, do nothing.
        if (this.ddCurPaginationPage + 1 <= maxDDPage) {
            this.ddCurPaginationPage = this.ddCurPaginationPage + 1;
            this.displayDDPage(this.ddCurPaginationPage);
        }

        $("ddPageCount").textContent = "( " + this.ddCurPaginationPage + " / " + this.getMaxDDPage() + " )";
    }

    // Given the url, will fetch 25 results.
    generate(url, pagesLeft, after = null) {
        updateGenerateFeedback(this.maxPages - pagesLeft, this.maxPages);

        // Checks for after and limit parameters
        let curUrl = url + ".json" + "?";
        if (after != null) {
            curUrl = curUrl + "after=" + after + "&";
        }
        curUrl = curUrl + "limit=25";

        fetch(curUrl)
            .then(response => response.json())
            .then(json => {
                let data = json.data;
                for (let i = 0; i < data.children.length; i++) {

                    // Finds the relevant reddit post data in the data
                    let redditPost = data.children[i].data;

                    // Check if post contains DD and if so, displays the post
                    if (this.containsDD(redditPost)) {
                        this.ddPosts.push(redditPost);
                        //$("dd").appendChild(this.buildPostSummary(redditPost));
                    }

                    // Scan the post for tickers and update the ticker count
                    this.scanForTickers(redditPost);
                }

                return data.after;

            })
            .then(afterParam => {
                let updatedPagesLeft = pagesLeft - 1;
                if (updatedPagesLeft == 0) {

                    // Sort and update the ticker count display
                    let topResults = sortTopOccurences(this.stockTickerCounts, this.topTickerCount);
                    $("tickers").appendChild(this.buildTopTickers(topResults));

                    // Update the dd page with the current pagination page.
                    this.displayDDPage(this.ddCurPaginationPage);

                    console.log(this.ddPosts);

                    // Reset some UI
                    $("generateFeedback").textContent = "";
                    $("generate").style.visibility = "visible";
                    this.ddCurPaginationPage = 1;
                    $("ddPageCount").textContent = "( " + this.ddCurPaginationPage + " / " + this.getMaxDDPage() + " )";
                } else {
                    this.generate(url, updatedPagesLeft, afterParam);
                }
            });
    }

    // Given a single data object from the reddi api
    // for a particular post
    // Will update the current counts of tickers.
    scanForTickers(data) {
        let title = data.title;
        let body = data.selftext;

        // regex to detect stock tickers.
        let regex;
        if (this.allowOneLetterTickers) {
            regex = /[ ]?[$]?[A-Z]{2,6}[ ]?|[ ][$]?[A-Z]{1}[ ]/g;
        } else {
            regex = /[ ]?[$]?[A-Z]{2,6}[ ]?/g;
        }

        // We want to take into account both the title and body of posts
        let words = title + " " + body;

        let matches = words.match(regex);

        // For each word in the post
        // if it matches a ticker we already have, update its count
        // or create a new key if not already found.
        if (matches) {
            for (let i = 0; i < matches.length; i++) {
                // shaves off spaces included from earlier regex
                let match = matches[i].trim();
                match = match.replace("$", "");
                // Only add this potential ticker if it's not explicitly excluded.
                if (!this.excludedWords.includes(match)) {
                    if (this.stockTickerCounts.hasOwnProperty(match)) {
                        this.stockTickerCounts[match] = this.stockTickerCounts[match] += 1;
                    } else {
                        this.stockTickerCounts[match] = 1;
                    }
                }
            }
        }
    }

    // Given a single data object from the reddit api
    // for a particular post,
    // Will search its flairs for a "DD" or due diligence
    // tag, returning true if found.
    containsDD(data) {
        let flair = data.link_flair_text;
        return (flair == "DD");
    }

    displayDDPage(pageNum) {
        // If there are no stored dd or we asked for a page outside
        // the max pages, do nothing.
        if (this.ddPosts.length == 0 || pageNum < 1) {
            console.log("Invalid page num");
            return;
        }


        let startIndex = ((pageNum - 1) * this.ddPostsMaxPaginationSize);
        let endIndex = ((pageNum) * this.ddPostsMaxPaginationSize) - 1;

        // Caps the ending index at the last index if we exceed the max pages.
        if ((pageNum * this.ddPostsMaxPaginationSize) > this.ddPosts.length) {
            endIndex = this.ddPosts.length - 1;
        }

        // Clears current DD and rebuild new DD
        $("dd").innerHTML = "";

        for (let i = startIndex; i <= endIndex; i++) {
            $("dd").appendChild(this.buildPostSummary(this.ddPosts[i]));
        }
    }

    // Given a single data object in the data array 
    // returned by fetching the json file associated
    // with any reddit page, will contruct a summary of
    // a post by collecting, building, and returning the 
    // relevant information into an HTML object.
    buildPostSummary(data) {

        let div = document.createElement("div");
        let h3 = document.createElement("h3");
        let date = document.createElement("h4");
        let body = document.createElement("div");
        let url = document.createElement("a");

        let collapseButton = document.createElement("button");
        let outerDiv = document.createElement("div");

        let dateTime = new Date(data.created_utc);
        dateTime.setFullYear(new Date().getFullYear());
        let dateTimeText = dateTime.toString().substring(0, 25)

        // We do this check to account for DD posts that might
        // be marked as DD but lack a body, so for example just
        // a single image.
        let parsedHTML = "";
        if (data.selftext_html != null) {
            parsedHTML = unEntity(data.selftext_html);
        }


        h3.textContent = data.title;
        date.textContent = dateTime.toString();
        body.innerHTML = parsedHTML;
        url.textContent = "SOURCE: " + data.url;
        url.href = data.url;

        collapseButton.type = "button";
        collapseButton.classList.add("collapsible");
        collapseButton.innerHTML = "<span style='color: #FFD31A;'>" + data.ups + "</span> <span style='color: #45B5AA;'>" + data.num_comments + "</span> <span>" + dateTimeText + " | " + data.title + "</span>";
        //collapseButton.textContent = data.ups + " | " + data.num_comments + " | " + dateTimeText + " | " + data.title;
        div.classList.add("collapsibleContent")

        collapseButton.addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });

        div.appendChild(h3);
        div.appendChild(date);
        div.appendChild(body);
        div.appendChild(url);

        outerDiv.appendChild(collapseButton);
        outerDiv.appendChild(div);

        return outerDiv;
    }


    // Given a sorted array of arrays of ticker information,
    // Will create and return a div containing the results.
    buildTopTickers(tickers) {
        let div = document.createElement("div");

        for (let i = 0; i < tickers.length; i++) {
            let div2 = document.createElement("div");
            let h3 = document.createElement("h3");
            h3.textContent = tickers[i][0] + ": " + tickers[i][1];

            div2.appendChild(h3);
            div.appendChild(div2);
        }

        return div;
    }
}

export default DataProcessor;


