/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  },
}

export default nextConfig
