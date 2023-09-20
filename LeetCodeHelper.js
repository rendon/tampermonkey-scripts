// ==UserScript==
// @name         LeetCode Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Facilitate interations with the LeetCode website. It adds two botton on the top-left to easily copy the problem ID and problem URL.
// @author       Rafael Rendon Pablo
// @match        https://leetcode.com/problems/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leetcode.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==
// Location: https://gist.github.com/rendon/e12f0fadd879af98482eeb3723b54748

(function() {
    'use strict';
    setTimeout(function() {
        const buttonStyle = 'margin: 2px; padding: 3px 3px; border: solid var(--gray-60) 3px; border-radius: 3px;';
        console.log("LeetCode Helper");
        const navBar = getNavBar();
        if (navBar == null) {
            console.log("Did not find nav bar");
            return;
        }
        console.log("Found nav bar");
        const copyURLButton = document.createElement('button');
        copyURLButton.append("URL/ID");
        copyURLButton.setAttribute('style', buttonStyle);
        copyURLButton.addEventListener("click", function() {
            const problemId = getProblemId();
            const url = 'https://leetcode.com/problems/' + problemId + '/';
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([problemId],
                        {type: 'text/plain'}
                    ),
                    'text/html': new Blob(
                        ['<a href="' + url + '">' + problemId + '</a>'],
                        {type: 'text/html'},
                    ),
                }),
            ]).then(() => {
                console.log("Copied URL to the clipboard: " + url);
            }).catch((err) => {
                console.error("Failed to copy URL to the clipboard: " + err);
            });
        });
        navBar.prepend(copyURLButton);
    }, 3000);

    function getNavBar() {
        const rootItemResults = document.getElementsByClassName('flex items-center');
        if (rootItemResults == null || rootItemResults.length === 0) {
            return null;
        }
        console.log("Found element");
        return rootItemResults[0];

    }

    function getProblemId() {
        return window.location.href.toString()
            .replace('https://leetcode.com/problems/', '')
            .replace(/\/.*/, '');
    }
})();
