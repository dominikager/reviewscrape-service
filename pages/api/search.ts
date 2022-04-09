// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

type Result = {
  url: string
  name: string
}

type Data = {
  results: Result[]
  status?: {
    code: number
    message: string
  }
}

function cors (res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
//  cors(res)
  const { q, ...scrapes } = req.query

  if (typeof q !== 'string') {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const url = "https://de.search.yahoo.com/search?q=" + q;

  const optionsRes = await fetch(url, { method: 'GET' }).catch(() => undefined)
  if (!optionsRes) {
    res.status(400).json({ error: 'could not load url' })
    return
  }

  const status = {
    code: optionsRes.status,
    message: optionsRes.statusText,
  }

  const targetRes = await fetch(url)
  const html = await targetRes.text().catch(() => '')
  
  if (!html) {
    res.status(400).json({ error: 'could not url contents' })
    return
  }

  const $ = cheerio.load(html)

  const results = $('#web .first .dd.richAlgo').map((i, card) => {
    const response =  {
      url: $(card).find("a").attr('href'),
      name: $(card).find('a').text(),
    }

    return response;
  }).get()

  res.json({ results,  status })
}
