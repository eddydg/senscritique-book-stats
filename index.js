// ==UserScript==
// @name         Book stats
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Get a book pages number and how much time it will take to finish it
// @author       Eddydg
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://www.senscritique.com/livre/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[
/* jshint ignore:end */
    /* jshint esnext: false */
    /* jshint esversion: 6 */


    /**
     * Initialization
     */
    const CACHE_NAME = 'BOOKS_CACHE';
    const domParser = new DOMParser();
    const wordsByPage = 254.5;
    const wpmSpeed = 300;

    const amazonBaseUrl = 'https://www.amazon.fr/gp/search?ie=UTF8&camp=1642&creative=6746&index=books&keywords=';
    const escapedBookTitle = escape(document.querySelector('.pvi-product-title').innerText.trim());
    const amazonUrl = amazonBaseUrl + escapedBookTitle;

    const getBookStatsLi = (matchedPages, readingMinutes) => {
        const titleSpan = document.createElement('span');
        titleSpan.title = 'Pour une vitesse moyenne de 300 mots/minute';
        titleSpan.innerText = `${matchedPages} pages (${prettifyMinutes(readingMinutes)})`;

        return getAdditionalStatsLi(titleSpan);
    };

    const insertMessage = (text = '') => {
        const span = document.createElement('span');
        span.innerText = text;
        const messageLi = getAdditionalStatsLi(span);
        insertAdditionalStats(messageLi);
    };

    const getAdditionalStatsLi = (child) => {
        const additionalDetailsLi = document.createElement("li");
        additionalDetailsLi.className = 'pvi-productDetails-item';
        additionalDetailsLi.appendChild(child);
        additionalDetailsLi.id = 'book-stats';
        return additionalDetailsLi;
    };

    const insertAdditionalStats = (additionalDetailsLi) => {
        const previousLi = document.querySelector('#book-stats');
        if (previousLi) {
            previousLi.replaceWith(additionalDetailsLi);
        } else {
            const bookDetailsUl = document.querySelector('.pvi-productDetails ul');
            bookDetailsUl.appendChild(additionalDetailsLi);
        }
    };


    const onGetDetailPage = (bookPageState) => {
        const dom2 = domParser.parseFromString(bookPageState.responseText, "text/html");
        const details = [...dom2.querySelectorAll('#detail_bullets_id .bucket .content')].map(b => b.innerText)[0];
        const matchedPagesStr = details.match(/[0-9]{2,4}(?= pages)/g);
        if (!matchedPagesStr || matchedPagesStr.length === 0) {
            insertMessage('Page count not found');
            return;
        }
        const matchedPages = parseInt(matchedPagesStr[0]);
        const readingMinutes = matchedPages * wordsByPage / wpmSpeed;

        const additionalDetailsLi = getBookStatsLi(matchedPages, readingMinutes);
        insertAdditionalStats(additionalDetailsLi);

        const newCache = cache || {};
        newCache[escapedBookTitle] = { matchedPages, readingMinutes };
        GM_setValue(CACHE_NAME, JSON.stringify(newCache));
    };

    const onGetResultsPage = (resultPageState) => {
        const dom = domParser.parseFromString(resultPageState.responseText, "text/html");
        const firstResult = dom.querySelectorAll('.s-access-detail-page')[0];
        if (!firstResult) {
            insertMessage('Not found on Amazon');
            return;
        }

        const firstResultUrl = firstResult.href;
        fetchAndAction(firstResultUrl, onGetDetailPage);
    };

    const cache = JSON.parse(GM_getValue(CACHE_NAME) || null);
    if (cache && escapedBookTitle in cache) {
        const { matchedPages, readingMinutes } = cache[escapedBookTitle];
        const additionalDetailsLi = getBookStatsLi(matchedPages, readingMinutes);
        insertAdditionalStats(additionalDetailsLi);
    } else {
        insertMessage('...');
        fetchAndAction(amazonUrl, onGetResultsPage);
    }


    /**
     * Tools
     */

    function fetchAndAction(url, callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            fetch: true,
            onreadystatechange: callback
        });
    }

    function prettifyMinutes (minutes) {
        return Math.floor(minutes / 60) + 'h' + (90 % 60) + 'm';
    }


/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */