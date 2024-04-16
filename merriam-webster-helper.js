// ==UserScript==
// @name         Merriam-Webster Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A tiny script that makes merriam-webster.com/ work nicely with Vimium, namely, it removes the focus from the search bar so that you can use the vim commands to move around.
// @author       Rafael Rendon Pablo
// @run-at       document-idle
// @match        https://www.merriam-webster.com/
// @match        https://www.merriam-webster.com/word-of-the-day
// @match        https://www.merriam-webster.com/word-of-the-day/*
// @match        https://www.merriam-webster.com/dictionary/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=merriam-webster.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Merriam-Websters' search form gets focused every time a tab becomes visible,
    // this interferes with Vimium.

    let isWordSaved = false;

    // Remove the focus when the page loads
    const searchButton = document.getElementsByClassName('btn position-absolute search-button search-dictionary');
    if (searchButton.length > 0) {
        console.log("Removing focus from search form")
        document.activeElement.blur();
    }

    // Remove the focus when the page regains visibility
    document.addEventListener("visibilitychange", function() {
        if (!document.hidden){
            console.log("Browser tab is visible, removing focus from search form")
            document.activeElement.blur();
        }
    });

    const wordElement = document.querySelectorAll('div.word-and-pronunciation h2');
    if (wordElement.length === 0) {
        return
    }
    console.log("On Word of the Day page")
    const word = wordElement[0].textContent;
    const wordAttributes = document.querySelectorAll('div.word-attributes');

    const wordStatus = document.createElement('span');
    wordStatus.setAttribute('class', 'word-syllables');
    wordAttributes[0].append(wordStatus);

    const savedLabel = document.createElement('span');
    savedLabel.append('SAVED');
    const unsavedLabel = document.createElement('span');
    unsavedLabel.append('-----');


    const handleSaveResponse = function(response) {
        const data = JSON.parse(response.responseText);
        if (data.status === 'success') {
            wordStatus.removeChild(unsavedLabel);
            wordStatus.append(savedLabel);
            console.log("Saved word successfully");
        } else {
            console.error(`Unable to save word: ${response.responseText}`);
        }
    };

    const takeButton = document.createElement('button');
    takeButton.append('Take');
    const NOT_TAKEN_STYLE = 'margin: 5px; padding: 3px;';
    const TAKEN_STYLE = 'margin: 5px; padding: 3px; border: 1px solid green;';
    takeButton.setAttribute('style', NOT_TAKEN_STYLE);
    takeButton.addEventListener('click', function () {
        copyUrl();

        // Indicate that we've already clicked the Take button
        takeButton.setAttribute('style', TAKEN_STYLE);

        if (isWordSaved) {
            return;
        }
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://www.merriam-webster.com/lapi/v1/wordlist/save',
            onload: handleSaveResponse,
            data: 'word=' + word + '&type=d',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
        });
    });

    wordStatus.append(takeButton);

    const handleIsSavedResponse = function(response) {
        const responseObject = JSON.parse(response.responseText);
        const isSaved = responseObject.data.data.saved;
        if (isSaved) {
            wordStatus.append(savedLabel);
            isWordSaved = true;
        } else {
            wordStatus.append(unsavedLabel);
        }
    };
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://www.merriam-webster.com/lapi/v1/wordlist/is-saved?word=' + word + '&type=d',
        onload: handleIsSavedResponse
    });

    function copyUrl() {
        const url = window.location.href.toString();
        navigator.clipboard.write([
            new ClipboardItem({
                'text/plain': new Blob([url],
                    {type: 'text/plain'}
                ),
                'text/html': new Blob(
                    ['<a href="' + url + '">' + url + '</a>'],
                    {type: 'text/html'},
                ),
            }),
        ]).then(() => {
            console.log("Copied URL to the clipboard: " + url);
        }).catch((err) => {
            console.error("Failed to copy URL to the clipboard: " + err);
        });
    }
})();
