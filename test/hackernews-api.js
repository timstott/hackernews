import { last } from 'lodash'
import { readFileSync } from 'fs'
import nock from 'nock'
import $ from 'cheerio'
import * as api from '../src/hackernews-api'

describe('fetchPosts', () => {
  const page1 = readFileSync('./test/fixtures/hackernews-page-01.html')
  const scope = nock('https://news.ycombinator.com')

  beforeEach(() => {
    scope.get('/news?p=1').reply(200, page1)
  })
  describe('when posts scope a single page', () => {
    it('resovles with a list of posts', () => api.fetchPosts(3).then((result) => {
      expect(nock.isDone()).toEqual(true)
      expect(result).toEqual([
        {
          author: 'Faizann20',
          comments: 4,
          points: 30,
          rank: 1,
          title: 'Using Ordered Markov Chains and User Information to Speed Up Password Cracking',
          uri: 'http://fsecurify.com/using-ordered-markov-chains-and-user-information-to-speed-up-password-cracking/'
        },
        {
          author: 'grellas',
          comments: 127,
          points: 145,
          rank: 2,
          title: "Warren Buffett's Annual Letter to Berkshire Hathaway Shareholders [pdf]",
          uri: 'http://berkshirehathaway.com/letters/2016ltr.pdf'
        },
        {
          author: 'vrudyi',
          comments: 2,
          points: 12,
          rank: 3,
          title: 'Easily Create Complex Workflows with AWS Step Functions',
          uri: 'https://agilevision.io/blog/serverless%20architecture/2017/02/12/easily-create-complex-workflows-with-aws-step-functions.html'
        }
      ])
    }))
  })

  describe('when posts scope multiple pages', () => {
    const page2 = readFileSync('./test/fixtures/hackernews-page-02.html')
    beforeEach(() => {
      scope.get('/news?p=2').reply(200, page2)
    })
    it('resovles with a list of posts', () => api.fetchPosts(55).then((result) => {
      expect(nock.isDone()).toEqual(true)
      expect(result.length).toEqual(55)
      expect(last(result)).toEqual({
        author: 'matt4077',
        comments: 168,
        points: 321,
        rank: 55,
        title: 'Kim Jong-Nam Was Killed by VX Nerve Agent, Malaysians Say',
        uri: 'https://www.nytimes.com/2017/02/23/world/asia/kim-jong-nam-vx-nerve-agent-.html'
      })
    }))
  })
})

describe('htmlPostToObject', () => {
  const titleRow = $(`
    <tr class='athing' id='13723645'>
      <td align="right" class="title" valign="top"><span class="rank">31.</span></td>
      <td class="votelinks" valign="top">
        <center>
          <a href='vote?id=13723645&amp;how=up&amp;goto=news%3Fp%3D2' id='up_13723645'>
          <div class='votearrow' title='upvote'></div></a>
        </center>
      </td>
      <td class="title">
        <a class="storylink" href="https://arstechnica.com/science/2017/02/bees-can-train-each-other-to-use-tools/">Bees can train each other to use tools</a> <span class="sitebit comhead">(<a href="from?site=arstechnica.com"><span class="sitestr">arstechnica.com</span></a>)</span>
      </td>
    </tr>`)

  const metaRow = $(`
    <tr>
      <td colspan="2"></td>
      <td class="subtext">
        <span class="score" id="score_13723645">207 points</span> by <a class="hnuser" href="user?id=tambourine_man">tambourine_man</a> <span class="age"><a href="item?id=13723645">22 hours ago</a></span> <span id="unv_13723645"></span> | <a href="hide?id=13723645&amp;goto=news%3Fp%3D2">hide</a> | <a href="item?id=13723645">49&nbsp;comments</a>
      </td>
    </tr>`)

  it('converts the post', () => {
    expect(api.htmlPostToObject([titleRow, metaRow])).toEqual({
      author: 'tambourine_man',
      comments: 49,
      points: 207,
      rank: 31,
      title: 'Bees can train each other to use tools',
      uri: 'https://arstechnica.com/science/2017/02/bees-can-train-each-other-to-use-tools/'
    })
  })
})
