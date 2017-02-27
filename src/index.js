import minimist from 'minimist'
import { toInteger } from 'lodash'
import { fetchPosts } from './hackernews-api'

const main = () => {
  const argv = minimist(process.argv)
  const count = toInteger(argv.posts)

  if (count <= 0 || count > 100) {
    console.log('missing option --posts n (where 0 > n <= 100)')
    process.exit(1)
  }

  fetchPosts(count).then(console.log)
}

export default main
