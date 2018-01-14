// ==UserScript==
// @name         Book stats
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Get a book pages number and how much time it will take to finish it
// @author       Eddydg
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://www.senscritique.com/livre/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* jshint ignore:start */
var inline_src = (<><![CDATA[
/* jshint ignore:end */
    /* jshint esnext: false */
    /* jshint esversion: 6 */

    const domParser = new DOMParser();
    const wordsByPage = 254.5;
    const wpmSpeed = 300;

    const prettifyMinutes = (minutes) => Math.floor(minutes / 60) + 'h' + (90 % 60) + 'm';

    const amazonBaseUrl = 'https://www.amazon.fr/gp/search?ie=UTF8&camp=1642&creative=6746&index=books&keywords=';
    const escapedBookTitle = escape(document.querySelector('.pvi-product-title').innerText.trim());
    const amazonUrl = amazonBaseUrl + escapedBookTitle;

    GM_xmlhttpRequest({
        method: "GET",
        url: amazonUrl,
        fetch: true,
        onreadystatechange: state => {
            const dom = domParser.parseFromString(state.responseText, "text/html");
            const firstResultUrl = dom.querySelectorAll('.s-access-detail-page')[0].href;

            GM_xmlhttpRequest({
                method: "GET",
                url: firstResultUrl,
                fetch: true,
                onreadystatechange: state2 => {
                    const dom2 = domParser.parseFromString(state2.responseText, "text/html");
                    const details = [...dom2.querySelectorAll('#detail_bullets_id .bucket .content')].map(b => b.innerText)[0];
                    const matchedPagesStr = details.match(/[0-9]{2,4}(?= pages)/g)[0];
                    const matchedPages = parseInt(matchedPagesStr);
                    const readingMinutes = wpmSpeed / matchedPages;

                    console.log(matchedPages + ' pages');
                    console.log(prettifyMinutes(readingMinutes));
                }
            });
        }
    });

/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */