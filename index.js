const axios = require('axios');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const pagesNumber = 1;
const baseLink = 'https://ngs.ru/text/?page=';
let page = 1;
let parsingTimeout = 0;
let dataLinks = [];
let i = 0;

function cutTegs(str) {
    const regex = /( |<([^>]+)>)/ig,
        result = str.replace(regex, " ");

    return result;
}

function getLinks() {
    // if (!link.startsWith("https")) {
    //     let link = baseLink + page;
    // } else {
    //     let link = page;
    // }
    let link = baseLink + page;
    console.log('Запрос статей по ссылке: ' + link);

    axios.get(link)
        .then(response => {
            let currentPage = response.data;
            const dom = new JSDOM(currentPage);

            let news = dom.window.document.querySelector('.central-column-container').querySelectorAll('article');

            getArticle(i, news);
        });

    page++;
};

function getArticle(i, news) {
    let link = news[i].querySelector('[data-test="archive-record-header"]').href;

    if (!link.startsWith("https")) {
        link = 'https://ngs.ru/' + link;
    }

    axios.get(link)
        .then(response => {
            let newsPage = response.data;
            const dom = new JSDOM(newsPage);
            let container = dom.window.document.querySelector('.central-column-container');

            let title = dom.window.document.querySelector('h1').textContent;
            title = cutTegs(title);
            let subtitle = container.querySelector('[itemprop="alternativeHeadline"]').textContent;

            let views = container.querySelector('#record-header').querySelector('[itemprop="item"]>span').textContent;
            views = views.replace(/&nbsp;/g, " ");

            let comments = container.querySelector("span.q7RUN").textContent;
            let date = container.querySelector('time>a').textContent;

            let containerText = dom.window.document.querySelector(``);

            let text = [];
            for (let i = 0; i < containerText.length; i++) {
                text.push({
                    title: containerText[i].querySelector('h2').textContent || '',
                    text: containerText[i].querySelector('p').textContent || ''
                });
            }

            let imagesUrl = container.querySelector(`[page-url="${link}"] picture>img`).href;
            let images = [];
            for (let i = 0; i < imagesUrl.length; i++) {
                images.push({
                    url: imagesUrl[i]
                });
            }

            let article = {
                link,
                title,
                subtitle,
                views,
                comments,
                date,
                text,
                images
            };

            dataLinks.push(article);

            if (i < 1) {
                i++;
                getArticle(i, news);
            } else {
                fs.writeFileSync('C:/Users/Сергей/Desktop/parser/links.json', JSON.stringify(dataLinks), (err) => {
                    if (err) throw err;
                });
                console.log('Парсинг завершён.');
            }
        })
        .catch(err => {
            console.log(err)
        });

}

for (let i = page; i <= pagesNumber; i++) {
    let getTimer = setTimeout(getLinks, parsingTimeout);
    parsingTimeout += 10000;
}