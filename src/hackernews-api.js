import { range, flatMap } from 'lodash'
import https from 'https'
import $ from 'cheerio'

const makeGetRequest = url => new Promise((resolve, reject) => {
  const request = https.get(url, (response) => {
    const { statusCode } = response
    const body = []
    response.on('data', chunk => body.push(chunk))
    response.on('end', () => {
      if (statusCode !== 200) {
        const errorMessage = `Failed GET request ${url} Responded with status code ${statusCode}`
        reject(new Error(errorMessage))
      }
      try {
        resolve(body.join(''))
      } catch (_) {
        reject(new Error(`Failed GET request ${url}`))
      }
    })
  })
  request.on('error', err => reject(err))
})

const BASE_URL = 'https://news.ycombinator.com/news'
const MAX_POSTS_PER_PAGE = 30

const parseInteger = text => (parseInt(text, 10))
const parseComments = (text) => {
  const pattern = /(\d+).comment/
  const [, count] = text.match(pattern) || [0, 0, 0]
  return parseInteger(count)
}

const htmlPostToObject = (titleRowMetaRow) => {
  const $titleRow = titleRowMetaRow[0]
  const $metaRow = titleRowMetaRow[1]

  return {
    author: $('a.hnuser', $metaRow).text(),
    comments: parseComments($($metaRow).text()),
    points: parseInteger($('.score', $metaRow).text()),
    rank: parseInteger($('.rank', $titleRow).text()),
    title: $('a.storylink', $titleRow).text(),
    uri: $('a.storylink', $titleRow).attr('href')
  }
}

const pageToHtmlPosts = (page) => {
  const $page = $.load(page, { normalizeWhitespace: true })
  const $titleRows = $page('table#hnmain tr.athing')
  return $titleRows.map((i, el) => [[$(el), $(el).next()]]).get()
}

const fetchPosts = limit => new Promise((resolve) => {
  const lastPage = Math.ceil(limit / MAX_POSTS_PER_PAGE)

  const requests = range(1, lastPage + 1)
    .map(pageNumber => `${BASE_URL}?p=${pageNumber}`)
    .map(pageUrl => makeGetRequest(pageUrl))

  const posts = Promise.all(requests)
    .then(pages => flatMap(pages, pageToHtmlPosts).map(htmlPostToObject).slice(0, limit))

  resolve(posts)
})

export { fetchPosts, htmlPostToObject }
