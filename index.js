// ==UserScript==
// @name         Book stats
// @namespace    http://tampermonkey.net/
// @version      1.3
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

  const escapedBookTitle = escapeText(document.querySelector('.pvi-product-title').innerText);

  const providers = {
    amazon: function(q) {
      const getUrl = (q) => (
        `https://www.amazon.fr/gp/search?ie=UTF8&camp=1642&creative=6746&index=books&keywords=${q}`
      );

      const parseResults = (dom) => {
        const firstResult = dom.querySelectorAll('.s-access-detail-page')[0];
        if (!firstResult) {
          insertMessage('Not found on Amazon');
          return;
        }

        fetchAndAction(firstResult.href, parsePageCount);
      };

      const parsePageCount = (dom) => {
        const details = [...dom.querySelectorAll('#detail_bullets_id .bucket .content')].map(b => b.innerText)[0];
        const matchedPagesStr = details.match(/[0-9]{2,4}(?= pages)/g);
        if (!matchedPagesStr || matchedPagesStr.length === 0) {
          insertMessage('Page count not found');
          return;
        }
        const matchedPages = parseInt(matchedPagesStr[0]);
        const readingMinutes = matchedPages * wordsByPage / wpmSpeed;
        const additionalDetailsLi = getBookStatsLi(matchedPages, readingMinutes);

        insertAdditionalStats(additionalDetailsLi);
        updateCache(q, { matchedPages, readingMinutes });
      };

      fetchAndAction(getUrl(q), parseResults);
    },

    fnac: function(q) {
      const getUrl = (q) => (
        `http://www.fnac.com//r/${q}?SCat=2!1`
      );

      const parseResults = (dom) => {
        const firstResult = [...dom.querySelectorAll('.Article-item .Article-desc a')].map(x => x.href)[0];
        if (!firstResult) {
          insertMessage('Not found on Fnac');
          return;
        }

        fetchAndAction(firstResult, parsePageCount);
      };

      const parsePageCount = (dom) => {
        const pageCountStr = [...dom.querySelectorAll('.whiteContent .Feature-item')]
          .filter(x => {
            const a = x.querySelector('.Feature-label');
            return a && a.innerText.trim() === 'Nombre de pages';
          })
          .map(x => x.querySelector('.Feature-desc').innerText.trim())[0];
        if (!pageCountStr) {
          insertMessage('Page count not found');
          return;
        }
        const matchedPages = parseInt(pageCountStr);
        const readingMinutes = matchedPages * wordsByPage / wpmSpeed;
        const additionalDetailsLi = getBookStatsLi(matchedPages, readingMinutes);

        insertAdditionalStats(additionalDetailsLi);
        updateCache(q, { matchedPages, readingMinutes });
      };

      fetchAndAction(getUrl(q), parseResults);
    }
  };

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

  const cache = JSON.parse(GM_getValue(CACHE_NAME) || null);
  if (cache && escapedBookTitle in cache) {
    const {
      matchedPages,
      readingMinutes
    } = cache[escapedBookTitle];
    const additionalDetailsLi = getBookStatsLi(matchedPages, readingMinutes);
    insertAdditionalStats(additionalDetailsLi);
  } else {
    insertMessage('...');
    const provider = providers['amazon'];
    provider(escapedBookTitle);
  }


  /**
   * Tools
   */

  function fetchAndAction(url, callback) {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      fetch: true,
      onreadystatechange: (response) => {
        const dom = domParser.parseFromString(response.responseText, "text/html");
        callback(dom);
      }
    });
  }

  function updateCache(bookTitle, values) {
    const newCache = cache || {};
    newCache[bookTitle] = values;
    GM_setValue(CACHE_NAME, JSON.stringify(newCache));
  }

  function prettifyMinutes(minutes) {
    return Math.floor(minutes / 60) + 'h' + (90 % 60) + 'm';
  }

  function escapeText(text = '') {
    return escape(text.trim());
  }


/* jshint ignore:start */
]]></>).toString();
var c = Babel.transform(inline_src, { presets: [ "es2015", "es2016" ] });
eval(c.code);
/* jshint ignore:end */