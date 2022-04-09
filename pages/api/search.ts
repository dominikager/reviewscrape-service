// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

function cors (res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

async function searchForLink(q: string, platform: string) {
  const url = "https://de.search.yahoo.com/search?q=" + q + " " + platform;
  const optionsRes = await fetch(url, { method: 'GET' }).catch(() => undefined)

  if (!optionsRes) {
    return
  }

  const targetRes = await fetch(url)
  const html = await targetRes.text().catch(() => '')
 
  const $ = cheerio.load(html)
  
  return $('#web .first .dd.algo').map((i, card) => {
    const response =  {
      url: $(card).find("a").attr('href'),
    }

    return response;
  }).get()
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  cors(res)
  const { q } = req.query
    
  if (typeof q !== 'string') {
    res.status(400).json({ error: 'query is required' })
    return
  }

  const tripadvisor = await searchForLink(q, "Tripadvisor");
  const facebook = await searchForLink(q, "Facebook");

  res.json({ tripadvisor, facebook })
}
