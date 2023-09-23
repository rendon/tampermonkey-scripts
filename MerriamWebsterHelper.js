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

    // Helpers
    function createButton(caption) {
        const button = document.createElement('button');
        button.append(caption);
        return button;
    }

    function createLabel(caption) {
        const label = document.createElement('span');
        label.append(caption);
        return label;
    }

    function getWordTitleContainer() {
        const wordRow = document.getElementsByClassName('parts-of-speech');
        if (wordRow.length === 0) {
            return null;
        }
        return wordRow[0].parentElement;
    }

    function onTheDictionaryPage() {
        return getWordTitleContainer() != null;
    }

    function getWordOfTheDayTitleContainer() {
        const results = document.querySelectorAll('div.word-and-pronunciation h2');
        if (results.length === 0) {
            return null;
        }
        return results[0];
    }

    function onTheWordOfTheDayPage() {
        return getWordOfTheDayTitleContainer() != null;
    }

    // Merriam-Websters' search form gets focused every time a tab becomes visible,
    // this interferes with Vimium.

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

    // =================================================================================================================
    const wordStatusStyle = 'margin: 2px; padding: 3px 3px; color: gray;';
    const saveButtonStyle = 'margin: 2px; padding: 3px 3px; border-radius: 5px;';
    function getWord() {
        const wordRow = getWordTitleContainer();
        if (wordRow == null) {
            return null;
        }
        const wordElement = wordRow.getElementsByClassName('hword');
        if (wordElement.length === 0) {
            console.error("Could not find word in word");
            return null;
        }
        return wordElement[0].textContent;
    }

    if (onTheDictionaryPage()) {
        // Remove the official Save button to avoid discrepancies with the new button.
        document.getElementById('save-word-dropdown-menu-nav-item').remove();

        const wordTitleContainer = getWordTitleContainer();
        console.log("We're on the dictionary page");
        const wordStatus = document.createElement('span');
        wordStatus.setAttribute('style', wordStatusStyle);
        wordTitleContainer.append(wordStatus);

        const word = getWord();
        const savedLabel = createLabel('Saved');

        const saveButton = createButton('Save');
        saveButton.setAttribute('style', saveButtonStyle);
        function handleSaveWord(response) {
            const data = JSON.parse(response.responseText);
            if (data.status === 'success') {
                wordStatus.removeChild(saveButton);
                wordStatus.append(savedLabel);
                console.log('Saved word');
            } else {
                console.error("Unable to save word");
            }
        }
        console.log("Word: " + word);
        saveButton.addEventListener('click', function () {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://www.merriam-webster.com/lapi/v1/wordlist/save',
                onload: handleSaveWord,
                data: 'word=' + word + '&type=d',
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
            });
        });

        function handleIsSaved(response) {
            const isSaved = JSON.parse(response.responseText).data.data.saved;
            if (isSaved) {
                wordStatus.append(savedLabel);
            } else {
                wordStatus.append(saveButton);
            }
        }

        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.merriam-webster.com/lapi/v1/wordlist/is-saved?word=' + word + '&type=d',
            onload: handleIsSaved
        });
        return
    }

    // =================================================================================================================

    if (onTheWordOfTheDayPage()) {
        console.log("On Word of the Day page")
        const wordOfTheDayContainer = getWordOfTheDayTitleContainer();
        const word = wordOfTheDayContainer.textContent;
        const wordAttributes = document.querySelectorAll('div.word-attributes');
        const wordStatus = document.createElement('span');
        wordStatus.setAttribute('class', 'word-syllables');
        wordAttributes[0].append(wordStatus);

        const savedLabel = createLabel('Saved');
        const handleSaveResponse = function (response) {
            const data = JSON.parse(response.responseText);
            if (data.status === 'success') {
                wordStatus.removeChild(saveButton);
                wordStatus.append(savedLabel);
                console.log("Saved word successfully");
            } else {
                console.error("Unable to save word");
            }
        };

        const saveButton = createButton('Save');
        saveButton.setAttribute('style', saveButtonStyle);

        saveButton.addEventListener('click', function () {
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

        const handleIsSavedResponse = function (response) {
            const isSaved = JSON.parse(response.responseText).data.data.saved;
            if (isSaved) {
                wordStatus.append(savedLabel);
            } else {
                wordStatus.append(saveButton);
            }
        };
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.merriam-webster.com/lapi/v1/wordlist/is-saved?word=' + word + '&type=d',
            onload: handleIsSavedResponse
        });
    }
})();