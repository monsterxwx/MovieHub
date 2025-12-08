// api/proxy.js (Vercel Node.js Function)
import axios from 'axios'
export default async (req, res) => {
  const { url } = req.query
  const response = await axios.get(url)
  res.status(200).json(response.data)
}
