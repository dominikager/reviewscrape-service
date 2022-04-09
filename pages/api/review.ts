import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import cheerio from 'cheerio'

type Review = {
  id: string
  user: string
  text: string
  rating: number
}

type Data = {
  reviews: Review[]
  status?: {
    code: number
    message: string
  }
}

// set headers for cors
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
  cors(res)
  const { url } = req.query

  if (typeof url !== 'string') {
    res.status(400).json({ error: 'url is required' })
    return
  }

  const optionsRes = await fetch(url, { method: 'OPTIONS' }).catch(() => undefined)
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
  const reviews = $('.review-container').map((i, card) => {
    let stars = 1;

    if($(card).find('.bubble_50').length > 0) {
      stars = 5
    }
    else if($(card).find('.bubble_40').length > 0) {
      stars = 4
    }
    else if($(card).find('.bubble_30').length > 0) {
      stars = 3
    }
    else if($(card).find('.bubble_20').length > 0) {
      stars = 2
    }

    const response =  {
      id: $(card).find(".reviewSelector").attr('data-reviewid') ?? 'id',
      user: $(card).find('.member_info .info_text').text(),
      text: $(card).find('.prw_reviews_text_summary_hsx').text(),
      rating :  stars
    }

    return response;
  }).get()

  res.json({ reviews, status })
}
